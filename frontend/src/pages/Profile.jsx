import { useState } from 'react';
import { Save, Store, User, Phone, MapPin } from 'lucide-react';
import { getShop, saveShop } from '../store/localStore';
import toast from 'react-hot-toast';

export default function Profile() {
  const shop = getShop() || {};

  const [form, setForm] = useState({
    name: shop.name || '',
    owner: shop.owner || '',
    phone: shop.phone || '',
    address: shop.address || '',
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!form.name || !form.owner) return;
    
    saveShop(form);
    toast.success('Shop profile updated successfully!');
    // Trigger quick refresh
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="card">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Shop Profile</h2>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Owner Name *</label>
              <input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} className="input" placeholder="Your name" required />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Shop Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="Shop name" required />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input" placeholder="Phone number" />
            </div>
            <div className="col-span-2">
              <label className="label flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</label>
              <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="input resize-none h-16" placeholder="Shop address" />
            </div>
          </div>

          <button type="submit" className="btn-primary gap-2">
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </form>
      </div>

      <div className="card bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <div className="text-center text-slate-600 dark:text-slate-400 text-sm space-y-1">
          <p className="font-bold text-slate-900 dark:text-white text-lg">📒 Katha Book</p>
          <p>Digital Due Book Management System</p>
          <p className="text-xs text-slate-400">Standalone Client-Side Version</p>
        </div>
      </div>
    </div>
  );
}
