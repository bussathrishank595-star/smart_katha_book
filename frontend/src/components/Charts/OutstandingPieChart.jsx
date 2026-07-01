import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function OutstandingPieChart({ data = [] }) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="card flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm">
        No data yet
      </div>
    );
  }
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Bill Status Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [v, 'Bills']} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
