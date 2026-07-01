import { Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getShop } from '../../store/localStore';

export default function Navbar({ title }) {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const shop = getShop() || {};

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) { navigate(`/customers?search=${encodeURIComponent(search.trim())}`); setSearch(''); }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-10">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
      <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
        <Search className="w-4 h-4 absolute left-3 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 text-slate-900 dark:text-slate-100 placeholder-slate-400" />
      </form>
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="btn-icon btn-ghost text-slate-500 dark:text-slate-400" title="Toggle theme">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer" title={shop.owner}>
          {shop.name?.charAt(0)?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
