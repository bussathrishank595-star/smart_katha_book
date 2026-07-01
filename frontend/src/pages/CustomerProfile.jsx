import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Plus, FileText, CreditCard } from 'lucide-react';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { formatCurrency, formatDate, relativeTime } from '../utils/dateHelpers';
import { sendSmsReminder } from '../utils/smsHelper';
import { getCustomers, getBills, addPaymentToBill, getShop } from '../store/localStore';
import toast from 'react-hot-toast';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shop = getShop() || {};

  const [customer, setCustomer] = useState(null);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentModal, setPaymentModal] = useState(null);
  const [payForm, setPayForm] = useState({ amountPaid: '', paymentMethod: 'cash', notes: '' });

  const fetchProfile = () => {
    const custs = getCustomers();
    const c = custs.find(x => x.id === id);
    if (!c) {
      setCustomer(null);
      return;
    }
    setCustomer(c);
    
    const allBills = getBills();
    const cBills = allBills.filter(b => b.customerId === id);
    setBills(cBills);

    const cPayments = [];
    cBills.forEach(b => {
      if (b.payments) {
        b.payments.forEach(p => {
          cPayments.push({
            ...p,
            billNumber: b.billNumber,
            billId: b.id
          });
        });
      }
    });
    // Sort payments by date descending
    cPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
    setPayments(cPayments);
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handlePayment = (e) => {
    e.preventDefault();
    if (!payForm.amountPaid || Number(payForm.amountPaid) <= 0) return;
    
    addPaymentToBill(paymentModal.id, {
      amount: Number(payForm.amountPaid),
      method: payForm.paymentMethod,
      note: payForm.notes
    });

    toast.success('Payment recorded');
    setPaymentModal(null);
    fetchProfile();
  };

  if (!customer) return <div className="text-center py-16 text-slate-500">Customer not found</div>;

  const totalOutstanding = bills.reduce((s, b) => s + b.dueAmount, 0);
  const totalPurchases = bills.reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid = bills.reduce((s, b) => s + b.paidAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/customers')} className="btn-ghost gap-2 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </button>

      <div className="card bg-gradient-to-r from-primary-600 to-violet-600 text-white !p-0 overflow-hidden">
        <div className="p-6 flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <p className="text-primary-200">{customer.shopName || 'No Shop Name'}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-primary-100">
              <span>📞 {customer.phone}</span>
              {customer.email && <span>✉️ {customer.email}</span>}
              {customer.address && <span>📍 {customer.address}</span>}
            </div>
          </div>
          <button
            onClick={() => sendSmsReminder({ customerName: customer.name, phone: customer.phone, dueAmount: totalOutstanding, dueDate: new Date(), shopName: shop.name })}
            className="btn bg-white/20 hover:bg-white/30 text-white border border-white/30"
          >
            <MessageSquare className="w-4 h-4" /> SMS Reminder
          </button>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/20 bg-black/10">
          {[
            { label: 'Total Purchases', value: formatCurrency(totalPurchases) },
            { label: 'Total Paid', value: formatCurrency(totalPaid) },
            { label: 'Outstanding Due', value: formatCurrency(totalOutstanding) },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className="text-xs text-primary-200">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Bills ({bills.length})</h3>
          <button onClick={() => navigate(`/billing?customerId=${customer.id}`)} className="btn-primary btn-sm text-xs py-1.5 px-3">
            <Plus className="w-3 h-3" /> New Bill
          </button>
        </div>
        {bills.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No bills yet</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="font-mono text-xs">{bill.billNumber}</td>
                    <td className="text-xs">{formatDate(bill.createdAt)}</td>
                    <td className="font-semibold">{formatCurrency(bill.totalAmount)}</td>
                    <td className="text-emerald-600 dark:text-emerald-400">{formatCurrency(bill.paidAmount)}</td>
                    <td className="text-red-600 dark:text-red-400 font-semibold">{formatCurrency(bill.dueAmount)}</td>
                    <td>
                      <div className="text-xs">
                        <p>{formatDate(bill.dueDate)}</p>
                        <p className="text-slate-500">{relativeTime(bill.dueDate)}</p>
                      </div>
                    </td>
                    <td><StatusBadge status={bill.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/billing/${bill.id}`)} className="btn-icon btn-ghost" title="View bill">
                          <FileText className="w-4 h-4 text-primary-500" />
                        </button>
                        {bill.dueAmount > 0 && (
                          <button
                            onClick={() => { setPaymentModal(bill); setPayForm({ amountPaid: bill.dueAmount, paymentMethod: 'cash', notes: '' }); }}
                            className="btn-icon btn-ghost"
                            title="Add payment"
                          >
                            <CreditCard className="w-4 h-4 text-emerald-500" />
                          </button>
                        )}
                        {bill.dueAmount > 0 && (
                          <button
                            onClick={() => sendSmsReminder({ customerName: customer.name, phone: customer.phone, dueAmount: bill.dueAmount, dueDate: bill.dueDate, shopName: shop.name })}
                            className="btn-icon btn-ghost"
                            title="SMS reminder"
                          >
                            <MessageSquare className="w-4 h-4 text-amber-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Payment History ({payments.length})</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No payments recorded</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill No</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td className="text-xs">{formatDate(p.date)}</td>
                    <td className="font-mono text-xs">{p.billNumber}</td>
                    <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="capitalize text-xs">{p.method}</td>
                    <td className="text-slate-500 text-xs">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title="Record Payment">
        {paymentModal && (
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm space-y-1">
              <p className="text-slate-600 dark:text-slate-400">Bill: <span className="font-mono font-semibold">{paymentModal.billNumber}</span></p>
              <p className="text-slate-600 dark:text-slate-400">Due Amount: <span className="font-semibold text-red-600">{formatCurrency(paymentModal.dueAmount)}</span></p>
            </div>
            <div>
              <label className="label">Amount Paid (₹) *</label>
              <input
                type="number"
                value={payForm.amountPaid}
                onChange={(e) => setPayForm((f) => ({ ...f, amountPaid: e.target.value }))}
                className="input"
                min={1}
                max={paymentModal.dueAmount}
                required
              />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select value={payForm.paymentMethod} onChange={(e) => setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="select">
                {['cash', 'upi', 'bank_transfer', 'cheque', 'other'].map((m) => (
                  <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <input value={payForm.notes} onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))} className="input" placeholder="Optional notes" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setPaymentModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-success flex-1">
                Record Payment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
