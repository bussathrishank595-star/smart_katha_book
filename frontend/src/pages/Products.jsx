import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import EmptyState from '../components/UI/EmptyState';
import { formatCurrency } from '../utils/dateHelpers';
import toast from 'react-hot-toast';

const EMPTY = { name: '', category: 'General', price: '', unit: 'pcs', stockQuantity: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const fetchProducts = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/products', { params: { search: q } });
      setProducts(data.products);
    } catch { toast.error('Failed to fetch products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(search); }, [search]);

  const openAdd = () => { setForm(EMPTY); setEditProduct(null); setModalOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ name: p.name, category: p.category || 'General', price: p.price, unit: p.unit || 'pcs', stockQuantity: p.stockQuantity || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity) };
      if (editProduct) {
        const { data } = await axiosClient.put(`/products/${editProduct._id}`, payload);
        setProducts((ps) => ps.map((p) => p._id === editProduct._id ? data.product : p));
        toast.success('Product updated');
      } else {
        const { data } = await axiosClient.post('/products', payload);
        setProducts((ps) => [data.product, ...ps]);
        toast.success('Product added');
      }
      setModalOpen(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axiosClient.delete(`/products/${deleteTarget._id}`);
      setProducts((ps) => ps.filter((p) => p._id !== deleteTarget._id));
      toast.success('Product deleted');
      setDeleteTarget(null);
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Products</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{products.length} products</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 w-full sm:w-56" />
          </div>
          <button id="add-product-btn" onClick={openAdd} className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" description="Add products to use them in bills." action={<button onClick={openAdd} className="btn-primary">Add Product</button>} />
        ) : (
          <div className="table-wrapper !rounded-none !border-0">
            <table className="table">
              <thead><tr><th>#</th><th>Product</th><th>Category</th><th>Price</th><th>Unit</th><th>Stock</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p._id}>
                    <td className="text-slate-500 text-xs">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <Package className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                      </div>
                    </td>
                    <td><span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{p.category || 'General'}</span></td>
                    <td className="font-semibold text-slate-900 dark:text-white">{formatCurrency(p.price)}</td>
                    <td className="text-slate-600 dark:text-slate-400">{p.unit || 'pcs'}</td>
                    <td>
                      <span className={`font-medium ${p.stockQuantity <= 5 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {p.stockQuantity || 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="btn-icon btn-ghost text-amber-500"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(p)} className="btn-icon btn-ghost text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Product Name *</label><input name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="Product name" required /></div>
            <div><label className="label">Category</label><input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input" placeholder="e.g. Grocery" list="cat-list" /><datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist></div>
            <div><label className="label">Price (₹) *</label><input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="input" placeholder="0.00" min={0} step={0.01} required /></div>
            <div><label className="label">Unit</label><input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="input" placeholder="pcs, kg, ltr..." /></div>
            <div><label className="label">Stock Quantity</label><input type="number" value={form.stockQuantity} onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))} className="input" placeholder="0" min={0} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : editProduct ? 'Update' : 'Add Product'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Product" message={`Delete "${deleteTarget?.name}"?`} />
    </div>
  );
}
