import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { BarChart2, ChevronDown } from 'lucide-react';
import { salesOverviewData } from '../../data/dashboardData';
import { useApp } from '../../context/useApp';

export default function SalesLineChart() {
  const { theme } = useApp();

  return (
    <div
      className={`border rounded-2xl p-6 flex flex-col justify-between shadow-sm ${
        theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sales Overview</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Revenue & Profit tracking</p>
          </div>
        </div>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition ${
            theme === 'dark'
              ? 'bg-[#07090A] border-[#202829] text-[#B4BABB] hover:text-white'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
        >
          <span>Last 30 Days</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesOverviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#08D9C0" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#08D9C0" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#202829' : '#e2e8f0'} vertical={false} />
            <XAxis dataKey="date" stroke={theme === 'dark' ? '#747E80' : '#94a3b8'} fontSize={12} tickLine={false} />
            <YAxis stroke={theme === 'dark' ? '#747E80' : '#94a3b8'} fontSize={12} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#0C1112' : '#ffffff',
                borderColor: theme === 'dark' ? '#202829' : '#e2e8f0',
                borderRadius: '12px',
                color: theme === 'dark' ? '#fff' : '#0f172a',
              }}
              formatter={(value) => [`RWF ${value.toLocaleString()}`, 'Sales']}
            />
            <Area type="monotone" dataKey="sales" stroke="#08D9C0" strokeWidth={3} fillOpacity={1} fill="url(#salesGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
