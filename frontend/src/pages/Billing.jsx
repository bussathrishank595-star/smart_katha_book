import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { formatCurrency, calcDueDate } from '../utils/dateHelpers';
import toast from 'react-hot-toast';

const CREDIT_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '15 Days', value: 15 },
  { label: '30 Days', value: 30 },
  { label: '45 Days', value: 45 },
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
];

export default function Billing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(searchParams.get('customerId') || '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [items, setItems] = useState([{ name: '', price: '', quantity: 1, unit: 'pcs', subtotal: 0 }]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [creditDays, setCreditDays] = useState(30);
  const [penaltyPerDay, setPenaltyPerDay] = useState(10);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch real customers from the backend MongoDB API
  useEffect(() => {
    axiosClient.get('/customers', { params: { limit: 100 } })
      .then(({ data }) => {
        setCustomers(data.customers);
      })
      .catch(() => {
        toast.error('Failed to load customers');
      });
  }, []);

  const totalAmount = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const dueAmount = Math.max(0, totalAmount - Number(paidAmount));
  const dueDate = calcDueDate(creditDays);

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      updated[index].subtotal = (Number(updated[index].price) || 0) * (Number(updated[index].quantity) || 0);
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, { name: '', price: '', quantity: 1, unit: 'pcs', subtotal: 0 }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) { toast.error('Please select a customer'); return; }
    if (items.some((i) => !i.name || !i.price || !i.quantity)) {
      toast.error('Please fill all product fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customerId: selectedCustomer,
        items: items.map((i) => ({
          name: i.name,
          price: Number(i.price),
          quantity: Number(i.quantity),
          unit: i.unit,
          subtotal: Number(i.subtotal),
        })),
        totalAmount,
        paidAmount: Number(paidAmount),
        dueAmount,
        dueDate: dueDate.toISOString(),
        creditDays,
        penaltyPerDay,
        notes,
      };
      
      const { data } = await axiosClient.post('/bills', payload);
      toast.success('Bill created successfully!');
      navigate(`/billing/${data.bill._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      !customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );
  const selected = customers.find((c) => c._id === selectedCustomer);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Bill</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Fill in the details to generate a bill</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">1. Select Customer</h3>
          <input
            placeholder="Search customer by name or phone..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="input"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {filteredCustomers.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => { setSelectedCustomer(c._id); setCustomerSearch(''); }}
                className={`text-left p-3 rounded-xl border-2 transition-all text-sm ${
                  selectedCustomer === c._id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-slate-500">{c.phone}</p>
              </button>
            ))}
          </div>
          {selected && (
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 text-sm">
              <p className="font-medium text-primary-700 dark:text-primary-300">✓ {selected.name}</p>
              <p className="text-primary-600 dark:text-primary-400 text-xs">{selected.phone}</p>
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">2. Add Products</h3>
            <button type="button" onClick={addItem} className="btn-ghost text-xs py-1 px-3">
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left pb-2 font-semibold">Product Name</th>
                  <th className="text-left pb-2 font-semibold w-24">Price (₹)</th>
                  <th className="text-left pb-2 font-semibold w-20">Qty</th>
                  <th className="text-left pb-2 font-semibold w-20">Unit</th>
                  <th className="text-right pb-2 font-semibold w-28">Subtotal</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="space-y-2">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="pr-2 py-1">
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(i, 'name', e.target.value)}
                        className="input text-xs"
                        placeholder="Product name"
                        required
                      />
                    </td>
                    <td className="pr-2 py-1">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(i, 'price', e.target.value)}
                        className="input text-xs w-24"
                        placeholder="0"
                        min={0}
                        step={0.01}
                        required
                      />
                    </td>
                    <td className="pr-2 py-1">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                        className="input text-xs w-20"
                        min={1}
                        required
                      />
                    </td>
                    <td className="pr-2 py-1">
                      <input
                        value={item.unit}
                        onChange={(e) => updateItem(i, 'unit', e.target.value)}
                        className="input text-xs w-20"
                        placeholder="pcs"
                      />
                    </td>
                    <td className="text-right font-semibold text-slate-900 dark:text-white py-1">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="py-1 pl-2">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="btn-icon btn-ghost text-red-500 p-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-end">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              Total: {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">3. Payment & Credit</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Paid Amount (₹)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="input"
                min={0}
                max={totalAmount}
              />
            </div>
            <div>
              <label className="label">Credit Period</label>
              <select value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value))} className="select">
                {CREDIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Penalty per Day (₹)</label>
              <input
                type="number"
                value={penaltyPerDay}
                onChange={(e) => setPenaltyPerDay(Number(e.target.value))}
                className="input"
                min={0}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="Optional..." />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-slate-800 to-slate-900 text-white dark:from-primary-900 dark:to-violet-900">
          <h3 className="font-semibold mb-4 text-slate-300">Bill Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Bill</p>
              <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Paid Now</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(Number(paidAmount))}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Remaining Due</p>
              <p className={`text-xl font-bold ${dueAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {formatCurrency(dueAmount)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Due Date: <span className="text-white font-medium">{dueDate.toLocaleDateString('en-IN')}</span></span>
            <span>Penalty: ₹{penaltyPerDay}/day after due date</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-3 text-base"
        >
          {saving ? 'Generating Bill...' : `Create Bill — ${formatCurrency(totalAmount)}`}
        </button>
      </form>
    </div>
  );
}
