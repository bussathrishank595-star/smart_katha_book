import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, Calendar, IndianRupee,
  CreditCard, Clock, AlertTriangle, CheckCircle, MessageSquare
} from 'lucide-react';
import StatCard from '../components/UI/StatCard';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate, relativeTime } from '../utils/dateHelpers';
import { sendSmsReminder } from '../utils/smsHelper';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amountPaid: '', paymentMethod: 'cash', notes: '' });
  const [paying, setPaying] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      axiosClient.get('/dashboard/stats'),
      axiosClient.get('/dashboard/charts'),
      axiosClient.get('/dashboard/alerts'),
    ])
      .then(([s, c, a]) => {
        setStats(s.data.stats);
        setCharts(c.data.charts);
        setAlerts(a.data);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [refresh]);

  const handleMarkPaid = async (bill) => {
    try {
      await axiosClient.post(`/bills/${bill._id}/payment`, {
        amountPaid: bill.dueAmount,
        paymentMethod: 'cash',
        notes: 'Marked as paid',
      });
      toast.success('Bill marked as Paid ✓');
      setRefresh((r) => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handlePartialPay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await axiosClient.post(`/bills/${payModal._id}/payment`, {
        amountPaid: Number(payForm.amountPaid),
        paymentMethod: payForm.paymentMethod,
        notes: payForm.notes,
      });
      toast.success('Payment recorded');
      setPayModal(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const statCards = stats
    ? [
        { title: 'Total Customers',    value: stats.totalCustomers,                        icon: Users,         color: 'primary' },
        { title: 'Total Sales',        value: formatCurrency(stats.totalSales),             icon: TrendingUp,    color: 'emerald' },
        { title: 'Total Pending',      value: formatCurrency(stats.totalPending),           icon: CreditCard,    color: 'amber' },
        { title: 'Monthly Collection', value: formatCurrency(stats.monthCollection),        icon: Calendar,      color: 'violet' },
        { title: 'Overdue Bills',      value: stats.overdueCount,                          icon: AlertTriangle, color: 'red' },
        { title: 'Due Today',          value: stats.dueTodayCount,                         icon: Clock,         color: 'rose' },
      ]
    : Array(6).fill(null);

  const allAlerts = alerts
    ? [
        ...(alerts.overdue || []).map((b) => ({ ...b, _type: 'overdue' })),
        ...(alerts.dueToday || []).map((b) => ({ ...b, _type: 'today' })),
        ...(alerts.dueTomorrow || []).map((b) => ({ ...b, _type: 'tomorrow' })),
        ...(alerts.upcoming || []).map((b) => ({ ...b, _type: 'upcoming' })),
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.shopName}</p>
        </div>
        <button onClick={() => navigate('/billing')} className="btn-primary">+ New Bill</button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={i} loading={loading || !stats} {...(card || {})} />
        ))}
      </div>

      {/* Chart */}
      {charts?.monthlySales && (
        <div className="card shadow-md border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Monthly Overview (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.monthlySales} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.4}/>
                </linearGradient>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.4}/>
                </linearGradient>
                <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false} 
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderRadius: '12px', 
                  border: 'none', 
                  color: '#fff',
                  fontSize: '12px' 
                }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`]} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="sales" name="Sales" fill="url(#colorSales)" radius={[4,4,0,0]} maxBarSize={45} />
              <Bar dataKey="collected" name="Collected" fill="url(#colorCollected)" radius={[4,4,0,0]} maxBarSize={45} />
              <Bar dataKey="due" name="Due" fill="url(#colorDue)" radius={[4,4,0,0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pending Bills */}
      <div className="card">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Pending Bills
          {allAlerts.length > 0 && (
            <span className="ml-2 badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {allAlerts.length}
            </span>
          )}
        </h2>

        {allAlerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-900 dark:text-white">All clear!</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">No pending dues right now 🎉</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Bill No</th>
                  <th>Due Date</th>
                  <th>Due Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allAlerts.map((bill) => {
                  const typeColors = {
                    overdue:  'border-l-4 border-l-red-500',
                    today:    'border-l-4 border-l-amber-500',
                    tomorrow: 'border-l-4 border-l-orange-400',
                    upcoming: '',
                  };
                  return (
                    <tr key={bill._id} className={typeColors[bill._type]}>
                      <td>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {bill.customerId?.name}
                          </p>
                          <p className="text-xs text-slate-500">{bill.customerId?.phone}</p>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{bill.billNumber}</td>
                      <td>
                        <p className="text-xs">{formatDate(bill.dueDate)}</p>
                        <p className={`text-xs font-medium ${
                          bill._type === 'overdue' ? 'text-red-500' :
                          bill._type === 'today' ? 'text-amber-500' : 'text-slate-500'
                        }`}>
                          {relativeTime(bill.dueDate)}
                        </p>
                      </td>
                      <td>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(bill.dueAmount)}
                        </span>
                        {bill.accruedPenalty > 0 && (
                          <p className="text-xs text-orange-500">
                            +{formatCurrency(bill.accruedPenalty)} penalty
                          </p>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={bill.status} />
                        {bill._type === 'overdue' && <p className="text-xs text-red-500 mt-0.5">{bill.daysOverdue}d overdue</p>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => handleMarkPaid(bill)}
                            className="btn text-xs py-1 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            title="Mark full amount as paid"
                          >
                            <CheckCircle className="w-3 h-3" /> Paid
                          </button>
                          <button
                            onClick={() => { setPayModal(bill); setPayForm({ amountPaid: bill.dueAmount, paymentMethod: 'cash', notes: '' }); }}
                            className="btn text-xs py-1 px-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            title="Record partial payment"
                          >
                            <CreditCard className="w-3 h-3" /> Pay
                          </button>
                          <button
                            onClick={() => sendSmsReminder({
                              customerName: bill.customerId?.name,
                              phone: bill.customerId?.phone,
                              dueAmount: bill.dueAmount,
                              dueDate: bill.dueDate,
                              shopName: user?.shopName,
                            })}
                            className="btn text-xs py-1 px-2 bg-violet-100 hover:bg-violet-200 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                            title="Send SMS reminder"
                          >
                            <MessageSquare className="w-3 h-3" /> SMS
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Record Payment" size="sm">
        {payModal && (
          <form onSubmit={handlePartialPay} className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">{payModal.customerId?.name}</p>
              <p className="text-slate-500">{payModal.billNumber}</p>
              <p className="text-red-600 font-bold">Due: {formatCurrency(payModal.dueAmount)}</p>
              {payModal.accruedPenalty > 0 && (
                <p className="text-orange-500 text-xs">+ Penalty: {formatCurrency(payModal.accruedPenalty)}</p>
              )}
            </div>
            <div>
              <label className="label">Amount Paid (₹)</label>
              <input
                type="number"
                value={payForm.amountPaid}
                onChange={(e) => setPayForm((f) => ({ ...f, amountPaid: e.target.value }))}
                className="input text-lg font-bold"
                min={1}
                max={payModal.dueAmount}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="select"
              >
                {['cash', 'upi', 'bank_transfer', 'cheque', 'other'].map((m) => (
                  <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input
                value={payForm.notes}
                onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                className="input"
                placeholder="e.g. UPI ref number"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPayModal(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-success flex-1" disabled={paying}>
                {paying ? 'Saving...' : `Record ₹${payForm.amountPaid || 0}`}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
