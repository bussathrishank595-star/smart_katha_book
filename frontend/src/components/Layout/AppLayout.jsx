import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/billing':   'Billing',
  '/payments':  'Payments',
  '/reports':   'Reports',
  '/profile':   'Settings',
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] || 'Katha Book';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
