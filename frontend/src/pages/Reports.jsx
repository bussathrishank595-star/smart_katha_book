import { useState, useEffect } from 'react';
import { Download, Filter } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import StatusBadge from '../components/UI/StatusBadge';
import { formatCurrency, formatDate } from '../utils/dateHelpers';
import { generateReportPDF } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { label: 'Daily',   value: 'daily' },
  { label: 'Weekly',  value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom',  value: 'custom' },
];

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bills');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { type: reportType };
      if (reportType === 'custom') {
        if (!startDate || !endDate) { toast.error('Please select date range'); setLoading(false); return; }
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const { data } = await axiosClient.get('/reports', { params });
      setReport(data.report);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportType !== 'custom') fetchReport();
  }, [reportType]);

  const handleDownloadPDF = () => {
    if (!report) return;
    generateReportPDF(report, user);
  };

  const summaryCards = report
    ? [
        { label: 'Total Sales',    value: formatCurrency(report.summary?.totalSales),    color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' },
        { label: 'Collected',      value: formatCurrency(report.summary?.totalCollected), color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
        { label: 'Pending',        value: formatCurrency(report.summary?.totalPending),   color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
        { label: 'Total Bills',    value: report.summary?.totalBills || 0,               color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="label">Report Type</label>
            <div className="flex flex-wrap gap-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setReportType(t.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    reportType === t.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {reportType === 'custom' && (
            <div className="flex gap-2 items-end">
              <div>
                <label className="label">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
              </div>
              <button onClick={fetchReport} className="btn-primary gap-2">
                <Filter className="w-4 h-4" /> Apply
              </button>
            </div>
          )}

          {report && (
            <button onClick={handleDownloadPDF} className="btn-secondary gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : report ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryCards.map(({ label, value, color }) => (
              <div key={label} className={`rounded-2xl p-4 ${color}`}>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="card !p-0 overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {[
                { key: 'bills',       label: `Bills (${report.bills?.length || 0})` },
                { key: 'payments',    label: `Payments (${report.payments?.length || 0})` },
                { key: 'pendingDues', label: `Pending Dues (${report.pendingDues?.length || 0})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === key
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-2">
              {activeTab === 'bills' && (
                <div className="table-wrapper !border-0">
                  <table className="table">
                    <thead>
                      <tr><th>Bill No</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {(report.bills || []).map((b) => (
                        <tr key={b._id}>
                          <td className="font-mono text-xs">{b.billNumber}</td>
                          <td>
                            <p className="font-medium text-slate-900 dark:text-white">{b.customerId?.name}</p>
                            <p className="text-xs text-slate-500">{b.customerId?.phone}</p>
                          </td>
                          <td className="text-xs">{formatDate(b.createdAt)}</td>
                          <td className="font-semibold">{formatCurrency(b.totalAmount)}</td>
                          <td className="text-emerald-600 dark:text-emerald-400">{formatCurrency(b.paidAmount)}</td>
                          <td className="text-red-600 dark:text-red-400">{formatCurrency(b.dueAmount)}</td>
                          <td><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="table-wrapper !border-0">
                  <table className="table">
                    <thead>
                      <tr><th>Date</th><th>Customer</th><th>Bill No</th><th>Amount</th><th>Method</th></tr>
                    </thead>
                    <tbody>
                      {(report.payments || []).map((p) => (
                        <tr key={p._id}>
                          <td className="text-xs">{formatDate(p.paymentDate)}</td>
                          <td>{p.customerId?.name}</td>
                          <td className="font-mono text-xs">{p.billId?.billNumber || '—'}</td>
                          <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(p.amountPaid)}</td>
                          <td className="capitalize text-xs">{(p.paymentMethod || 'cash').replace('_', ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'pendingDues' && (
                <div className="table-wrapper !border-0">
                  <table className="table">
                    <thead>
                      <tr><th>Customer</th><th>Bill No</th><th>Due Date</th><th>Due</th><th>Penalty</th><th>Total</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {(report.pendingDues || []).map((b) => (
                        <tr key={b._id}>
                          <td>
                            <p className="font-medium text-slate-900 dark:text-white">{b.customerId?.name}</p>
                            <p className="text-xs text-slate-500">{b.customerId?.phone}</p>
                          </td>
                          <td className="font-mono text-xs">{b.billNumber}</td>
                          <td className="text-xs">{formatDate(b.dueDate)}</td>
                          <td className="text-red-600 dark:text-red-400 font-semibold">{formatCurrency(b.dueAmount)}</td>
                          <td className="text-orange-500">{b.accruedPenalty > 0 ? formatCurrency(b.accruedPenalty) : '—'}</td>
                          <td className="font-bold text-red-700 dark:text-red-400">{formatCurrency(b.totalOutstanding || b.dueAmount)}</td>
                          <td><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          Select a report type to view data
        </div>
      )}
    </div>
  );
}
