import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { stockStatusData } from '../../data/dashboardData';

export default function StockDonutChart() {
  return (
    <div className="bg-[#111516] border border-[#202829] rounded-2xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/30 flex items-center justify-center text-[#08d9c0]">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Stock Status</h3>
            <p className="text-xs text-[#a5acad]">Inventory health ratio</p>
          </div>
        </div>
      </div>

      <div className="relative h-[200px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={stockStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
              {stockStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#0c1112', borderColor: '#202829', borderRadius: '12px', color: '#fff' }}
              formatter={(val) => [`${val}%`, 'Share']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-white">78%</span>
          <span className="text-[11px] text-[#08d9c0] font-semibold uppercase tracking-wider">In Stock</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#202829] text-center">
        {stockStatusData.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-[#a5acad]">{item.name}</span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">{item.value}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
