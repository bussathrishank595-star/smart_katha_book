import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, MessageSquare, Plus } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { formatCurrency, formatDate, relativeTime } from '../utils/dateHelpers';
import { generateBillPDF } from '../utils/pdfGenerator';
import { sendSmsReminder } from '../utils/smsHelper';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bill, setBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amountPaid: '', paymentMethod: 'cash', notes: '' });
  const [paying, setPaying] = useState(false);

  const fetchBill = async () => {
    try {
      const { data } = await axiosClient.get(`/bills/${id}`);
      setBill(data.bill);
      setPayments(data.payments);
    } catch {
      toast.error('Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBill(); }, [id]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await axiosClient.post(`/bills/${id}/payment`, {
        amountPaid: Number(payForm.amountPaid),
        paymentMethod: payForm.paymentMethod,
        notes: payForm.notes,
      });
      toast.success('Payment recorded');
      setPayModal(false);
      fetchBill();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="p-8"><div className="skeleton h-64 rounded-2xl" /></div>;
  if (!bill) return <div className="text-center py-16 text-slate-500">Bill not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => generateBillPDF(bill, payments, user)}
            className="btn-secondary gap-2"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          {bill.dueAmount > 0 && (
            <>
              <button
                onClick={() => sendSmsReminder({
                  customerName: bill.customerId?.name,
                  phone: bill.customerId?.phone,
                  dueAmount: bill.totalOutstanding || bill.dueAmount,
                  dueDate: bill.dueDate,
                  shopName: user?.shopName,
                })}
                className="btn-secondary gap-2"
              >
                <MessageSquare className="w-4 h-4" /> SMS
              </button>
              <button
                onClick={() => { setPayModal(true); setPayForm({ amountPaid: bill.dueAmount, paymentMethod: 'cash', notes: '' }); }}
                className="btn-success gap-2"
              >
                <Plus className="w-4 h-4" /> Add Payment
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bill Info Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bill Number</p>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{bill.billNumber}</p>
          </div>
          <StatusBadge status={bill.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Customer</p>
            <p className="font-semibold text-slate-900 dark:text-white">{bill.customerId?.name}</p>
            <p className="text-xs text-slate-500">{bill.customerId?.phone}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Bill Date</p>
            <p className="font-medium text-slate-900 dark:text-white">{formatDate(bill.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Due Date</p>
            <p className="font-medium text-slate-900 dark:text-white">{formatDate(bill.dueDate)}</p>
            <p className="text-xs text-slate-500">{relativeTime(bill.dueDate)}</p>
          </div>
          {bill.notes && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-slate-500 mb-0.5">Notes</p>
              <p className="text-slate-700 dark:text-slate-300">{bill.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Items</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th className="text-right">Price</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {bill.items?.map((item, i) => (
                <tr key={i}>
                  <td className="text-slate-500">{i + 1}</td>
                  <td className="font-medium text-slate-900 dark:text-white">{item.name}</td>
                  <td>{item.quantity}</td>
                  <td className="text-slate-500">{item.unit}</td>
                  <td className="text-right">{formatCurrency(item.price)}</td>
                  <td className="text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financials */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Financial Summary</h3>
        <div className="space-y-3">
          {[
            { label: 'Total Bill Amount', value: formatCurrency(bill.totalAmount), bold: false },
            { label: 'Amount Paid', value: formatCurrency(bill.paidAmount), color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Due Amount', value: formatCurrency(bill.dueAmount), color: 'text-red-600 dark:text-red-400' },
            ...(bill.accruedPenalty > 0 ? [
              { label: `Penalty (₹${bill.penaltyPerDay}/day)`, value: formatCurrency(bill.accruedPenalty), color: 'text-orange-500' },
              { label: 'Total Outstanding', value: formatCurrency(bill.totalOutstanding), bold: true, color: 'text-red-700 dark:text-red-400' },
            ] : []),
          ].map(({ label, value, color = '', bold }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
              <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
              <span className={`text-sm font-${bold ? 'bold' : 'semibold'} ${color || 'text-slate-900 dark:text-white'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Payment History ({payments.length})</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No payments recorded yet</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p, i) => (
              <div key={p._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(p.amountPaid)}</p>
                  <p className="text-xs text-slate-500">{formatDate(p.paymentDate)} • {(p.paymentMethod || 'cash').replace('_', ' ')}</p>
                  {p.notes && <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Remaining</p>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(p.remainingDue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(null)} title="Add Payment">
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm space-y-1">
            <p>Due: <span className="font-semibold text-red-600">{formatCurrency(bill.dueAmount)}</span></p>
            {bill.accruedPenalty > 0 && <p>+ Penalty: <span className="font-semibold text-orange-500">{formatCurrency(bill.accruedPenalty)}</span></p>}
          </div>
          <div>
            <label className="label">Amount Paid (₹) *</label>
            <input type="number" value={payForm.amountPaid} onChange={(e) => setPayForm((f) => ({ ...f, amountPaid: e.target.value }))} className="input" min={1} required />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select value={payForm.paymentMethod} onChange={(e) => setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="select">
              {['cash', 'upi', 'bank_transfer', 'cheque', 'other'].map((m) => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <input value={payForm.notes} onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))} className="input" placeholder="Optional" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setPayModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-success flex-1" disabled={paying}>{paying ? 'Recording...' : 'Record Payment'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
