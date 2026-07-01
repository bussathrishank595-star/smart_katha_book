import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Wallet, BarChart3, Settings,
  BookOpen, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers',  label: 'Customers', icon: Users },
  { to: '/billing',    label: 'Billing',   icon: FileText },
  { to: '/payments',   label: 'Payments',  icon: Wallet },
  { to: '/reports',    label: 'Reports',   icon: BarChart3 },
  { to: '/profile',    label: 'Settings',  icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`relative flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Katha Book</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{user?.shopName}</p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`} title={collapsed ? label : undefined}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Logout Footer */}
      <div className="px-2 py-4 border-t border-slate-200 dark:border-slate-700/50 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user?.shopName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.name}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`nav-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button onClick={() => setCollapsed(c => !c)} className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all z-10">
        {collapsed ? <ChevronRight className="w-3 h-3 text-slate-500" /> : <ChevronLeft className="w-3 h-3 text-slate-500" />}
      </button>
    </aside>
  );
}
