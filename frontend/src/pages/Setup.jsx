import { useState } from 'react';
import { BookOpen, Store, User, Phone, MapPin } from 'lucide-react';
import { saveShop, seedSampleData } from '../store/localStore';

export default function Setup() {
  const [form, setForm] = useState({ name: '', owner: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.owner) return;
    setSaving(true);
    saveShop({ ...form, createdAt: new Date().toISOString() });
    seedSampleData();
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl items-center justify-center shadow-2xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Katha Book</h1>
          <p className="text-primary-300 mt-1">Digital Due Book for your Shop</p>
        </div>

        {/* Setup Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-1">Welcome! 👋</h2>
          <p className="text-primary-200 text-sm mb-6">Enter your shop details to get started</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-primary-200 uppercase tracking-wider mb-2">
                <Store className="w-3.5 h-3.5" /> Shop Name *
              </label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                placeholder="e.g. Sharma General Store"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-primary-200 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5" /> Owner Name *
              </label>
              <input
                value={form.owner}
                onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-primary-200 uppercase tracking-wider mb-2">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                placeholder="+91 XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-primary-200 uppercase tracking-wider mb-2">
                <MapPin className="w-3.5 h-3.5" /> Shop Address
              </label>
              <input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                placeholder="Street, City"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !form.name || !form.owner}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-violet-600 hover:from-primary-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {saving ? 'Setting up...' : '🚀 Start Using Katha Book'}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-400/60 text-xs mt-6">
          Sample customers & bills will be loaded automatically
        </p>
      </div>
    </div>
  );
}
