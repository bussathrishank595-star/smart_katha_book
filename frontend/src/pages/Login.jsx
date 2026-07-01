import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid login details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl items-center justify-center shadow-2xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-sans">Katha Book</h1>
          <p className="text-primary-300 mt-1 text-sm font-medium">Digital Due Book Management</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-1">Admin Access</h2>
          <p className="text-primary-200 text-sm mb-6">Log in to manage customer dues and bills</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-primary-200 uppercase tracking-wider mb-2">
                <Mail className="w-3.5 h-3.5" /> Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                placeholder="admin@kathabook.com"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-primary-200 uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-violet-600 hover:from-primary-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 mt-2"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="text-center text-primary-400/60 text-xs mt-6">
          Authorized Admin Personnel Only
        </p>
      </div>
    </div>
  );
}
