import { useState, useEffect } from 'react';
import { Download, Filter } from 'lucide-react';
import StatusBadge from '../components/UI/StatusBadge';
import { formatCurrency, formatDate } from '../utils/dateHelpers';
import { generateReportPDF } from '../utils/pdfGenerator';
import { getBills, getCustomers, getShop } from '../store/localStore';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { label: 'Daily',   value: 'daily' },
  { label: 'Weekly',  value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom',  value: 'custom' },
];

export default function Reports() {
  const shop = getShop() || {};
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState('bills');

  const generateReport = () => {
    const bills = getBills();
    const customers = getCustomers();
    const custMap = Object.fromEntries(customers.map(c => [c.id, c]));

    const now = new Date();
    let startLimit = new Date(0);
    let endLimit = new Date();

    if (reportType === 'daily') {
      startLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (reportType === 'weekly') {
      startLimit = new Date();
      startLimit.setDate(now.getDate() - 7);
    } else if (reportType === 'monthly') {
      startLimit = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (reportType === 'custom') {
      if (!startDate || !endDate) {
        toast.error('Please select date range');
        return;
      }
      startLimit = new Date(startDate);
      // set to end of that day
      endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
    }

    const filteredBills = bills.filter(b => {
      const created = new Date(b.createdAt);
      return created >= startLimit && created <= endLimit;
    });

    const reportBills = filteredBills.map(b => ({ ...b, customerId: custMap[b.customerId] }));

    const reportPayments = [];
    filteredBills.forEach(b => {
      if (b.payments) {
        b.payments.forEach(p => {
          const pd = new Date(p.date);
          if (pd >= startLimit && pd <= endLimit) {
            reportPayments.push({
              ...p,
              billNumber: b.billNumber,
              customer: custMap[b.customerId]
            });
          }
        });
      }
    });

    const pendingDues = bills.filter(b => b.dueAmount > 0).map(b => ({ ...b, customerId: custMap[b.customerId] }));

    const totalSales = reportBills.reduce((s, b) => s + b.totalAmount, 0);
    const totalCollected = reportPayments.reduce((s, p) => s + p.amount, 0);
    const totalPending = pendingDues.reduce((s, b) => s + b.dueAmount, 0);

    setReport({
      summary: {
        totalSales,
        totalCollected,
        totalPending,
        totalBills: reportBills.length
      },
      bills: reportBills,
      payments: reportPayments,
      pendingDues
    });
  };

  useEffect(() => {
    if (reportType !== 'custom') generateReport();
  }, [reportType]);

  const handleDownloadPDF = () => {
    if (!report) return;
    generateReportPDF(report, shop);
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
              <button onClick={generateReport} className="btn-primary">
                Apply
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

      {report ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryCards.map(({ label, value, color }) => (
              <div key={label} className={`rounded-2xl p-4 ${color}`}>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>

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
                        <tr key={b.id}>
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
                      {(report.payments || []).map((p, i) => (
                        <tr key={i}>
                          <td className="text-xs">{formatDate(p.date)}</td>
                          <td>{p.customer?.name}</td>
                          <td className="font-mono text-xs">{p.billNumber}</td>
                          <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="capitalize text-xs">{p.method}</td>
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
                      <tr><th>Customer</th><th>Bill No</th><th>Due Date</th><th>Due</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {(report.pendingDues || []).map((b) => (
                        <tr key={b.id}>
                          <td>
                            <p className="font-medium text-slate-900 dark:text-white">{b.customerId?.name}</p>
                            <p className="text-xs text-slate-500">{b.customerId?.phone}</p>
                          </td>
                          <td className="font-mono text-xs">{b.billNumber}</td>
                          <td className="text-xs">{formatDate(b.dueDate)}</td>
                          <td className="text-red-600 dark:text-red-400 font-semibold">{formatCurrency(b.dueAmount)}</td>
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
