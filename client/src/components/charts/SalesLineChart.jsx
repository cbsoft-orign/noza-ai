import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { BarChart2, ChevronDown } from 'lucide-react';
import { salesOverviewData } from '../../data/dashboardData';

export default function SalesLineChart() {
  return (
    <div className="bg-[#111516] border border-[#202829] rounded-2xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/30 flex items-center justify-center text-[#08d9c0]">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Sales Overview</h3>
            <p className="text-xs text-[#a5acad]">Revenue & Profit tracking</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#07090a] border border-[#202829] text-xs text-[#a5acad] hover:text-white transition">
          <span>Last 30 Days</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesOverviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#08d9c0" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#08d9c0" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#202829" vertical={false} />
            <XAxis dataKey="date" stroke="#747d80" fontSize={12} tickLine={false} />
            <YAxis stroke="#747d80" fontSize={12} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0c1112', borderColor: '#202829', borderRadius: '12px', color: '#fff' }}
              formatter={(value) => [`RWF ${value.toLocaleString()}`, 'Sales']}
            />
            <Area type="monotone" dataKey="sales" stroke="#08d9c0" strokeWidth={3} fillOpacity={1} fill="url(#salesGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
