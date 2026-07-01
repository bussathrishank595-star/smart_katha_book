import { useEffect, useState } from 'react';
import { getBills, getCustomers } from '../store/localStore';
import { formatCurrency, formatDate } from '../utils/dateHelpers';
import EmptyState from '../components/UI/EmptyState';
import { Wallet } from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const bills = getBills();
    const customers = getCustomers();
    const custMap = Object.fromEntries(customers.map(c => [c.id, c]));

    const list = [];
    bills.forEach(b => {
      if (b.payments) {
        b.payments.forEach(p => {
          list.push({
            ...p,
            billNumber: b.billNumber,
            billId: b.id,
            customer: custMap[b.customerId]
          });
        });
      }
    });

    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    setPayments(list);
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment History</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{payments.length} transactions</p>
      </div>
      <div className="card !p-0 overflow-hidden">
        {payments.length === 0 ? (
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
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td className="text-xs">{formatDate(p.date)}</td>
                    <td>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{p.customer?.name || '—'}</p>
                        <p className="text-xs text-slate-500">{p.customer?.phone}</p>
                      </div>
                    </td>
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
    </div>
  );
}
