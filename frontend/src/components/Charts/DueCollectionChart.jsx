import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DueCollectionChart({ data = [] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Collection vs Due Trend</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `₹${v?.toLocaleString('en-IN')}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="collected" name="Collected" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="due" name="Due" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
