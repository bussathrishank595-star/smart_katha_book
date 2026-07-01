import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ₹{p.value?.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

export default function MonthlySalesChart({ data = [] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Monthly Sales Overview</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-slate-500" />
          <YAxis tick={{ fontSize: 11 }} className="text-slate-500" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="sales" name="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="due" name="Due" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
