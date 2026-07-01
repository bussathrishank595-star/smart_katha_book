import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, MessageSquare, Eye, Phone } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import EmptyState from '../components/UI/EmptyState';
import { formatCurrency } from '../utils/dateHelpers';
import { sendSmsReminder } from '../utils/smsHelper';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchCustomers = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/customers', { params: { search: q, limit: 100 } });
      setCustomers(data.customers);
    } catch {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(search); }, [search]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditCustomer(null); setModalOpen(true); };
  const openEdit = (c) => {
    setEditCustomer(c);
    setForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', notes: c.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    setSaving(true);
    try {
      if (editCustomer) {
        const { data } = await axiosClient.put(`/customers/${editCustomer._id}`, form);
        setCustomers((cs) => cs.map((c) => c._id === editCustomer._id ? data.customer : c));
        toast.success('Customer updated');
      } else {
        const { data } = await axiosClient.post('/customers', form);
        setCustomers((cs) => [data.customer, ...cs]);
        toast.success('Customer added');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axiosClient.delete(`/customers/${deleteTarget._id}`);
      setCustomers((cs) => cs.filter((c) => c._id !== deleteTarget._id));
      toast.success('Customer deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{customers.length} customers total</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="customer-search"
              placeholder="Search name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full sm:w-64"
            />
          </div>
          <button id="add-customer-btn" onClick={openAdd} className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No customers yet"
            description="Add your first customer to get started."
            action={<button onClick={openAdd} className="btn-primary">Add Customer</button>}
          />
        ) : (
          <div className="table-wrapper !rounded-none !border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Total Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c._id}>
                    <td className="text-slate-500 text-xs">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                          {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-700 dark:text-slate-300">{c.phone}</td>
                    <td>
                      <span className={`font-semibold ${c.totalDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(c.totalDue || 0)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/customers/${c._id}`)} className="btn-icon btn-ghost text-primary-600 dark:text-primary-400" title="View profile">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(c)} className="btn-icon btn-ghost text-amber-600 dark:text-amber-400" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {c.totalDue > 0 && (
                          <button
                            title="Send SMS reminder"
                            onClick={() => sendSmsReminder({ customerName: c.name, phone: c.phone, dueAmount: c.totalDue, dueDate: new Date(), shopName: user?.shopName })}
                            className="btn-icon btn-ghost text-emerald-600 dark:text-emerald-400"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(c)} className="btn-icon btn-ghost text-red-500" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCustomer ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Customer Name *</label>
              <input name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="Full name" required />
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input name="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input" placeholder="+91 XXXXXXXXXX" required />
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input name="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input" placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input name="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="input" placeholder="Full address" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input resize-none h-20" placeholder="Any additional notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : editCustomer ? 'Update' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated bills and payments will also be deleted.`}
      />
    </div>
  );
}
