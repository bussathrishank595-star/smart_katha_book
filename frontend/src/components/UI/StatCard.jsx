import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, trendLabel, loading }) {
  const colors = {
    primary:  'from-primary-500  to-primary-600  bg-primary-500',
    emerald:  'from-emerald-500  to-emerald-600  bg-emerald-500',
    amber:    'from-amber-500    to-amber-600    bg-amber-500',
    red:      'from-red-500      to-red-600      bg-red-500',
    violet:   'from-violet-500   to-violet-600   bg-violet-500',
    cyan:     'from-cyan-500     to-cyan-600     bg-cyan-500',
    rose:     'from-rose-500     to-rose-600     bg-rose-500',
    sky:      'from-sky-500      to-sky-600      bg-sky-500',
  };
  const grad = colors[color] || colors.primary;

  if (loading) {
    return (
      <div className="card flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-6 w-16 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="card group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trendLabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : trend < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-500" />
              ) : null}
              {trendLabel}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad.split(' ')[0]} ${grad.split(' ')[1]} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
