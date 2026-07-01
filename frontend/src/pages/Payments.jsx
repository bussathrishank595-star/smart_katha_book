import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/dateHelpers';
import EmptyState from '../components/UI/EmptyState';
import { Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/payments', { params: { limit: 100 } });
      setPayments(data.payments);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment History</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{payments.length} transactions</p>
      </div>
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments yet" description="Payments will appear here once you record them." />
        ) : (
          <div className="table-wrapper !rounded-none !border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Bill No</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Remaining Due</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="text-xs">{formatDate(p.paymentDate)}</td>
                    <td>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{p.customerId?.name || '—'}</p>
                        <p className="text-xs text-slate-500">{p.customerId?.phone}</p>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{p.billId?.billNumber || '—'}</td>
                    <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(p.amountPaid)}</td>
                    <td className="capitalize text-xs">{(p.paymentMethod || 'cash').replace('_', ' ')}</td>
                    <td className="text-red-600 dark:text-red-400">{formatCurrency(p.remainingDue)}</td>
                    <td className="text-slate-500 text-xs">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
