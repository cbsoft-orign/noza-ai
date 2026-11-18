import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function StockDonutChart() {
  const { theme, products } = useApp();
  const inStock = products.filter((product) => product.quantity > product.low_stock_threshold).length;
  const lowStock = products.filter((product) => product.quantity > 0 && product.quantity <= product.low_stock_threshold).length;
  const outOfStock = products.filter((product) => product.quantity <= 0).length;
  const total = products.length || 1;
  const stockStatusData = [
    { name: 'In Stock', value: Math.round((inStock / total) * 100), color: '#08d9c0' },
    { name: 'Low Stock', value: Math.round((lowStock / total) * 100), color: '#f59e0b' },
    { name: 'Out of Stock', value: Math.round((outOfStock / total) * 100), color: '#ef4444' },
  ];
  const inStockPercent = stockStatusData[0].value;

  return (
    <div
      className={`border rounded-2xl p-6 flex flex-col justify-between shadow-sm ${
        theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Stock Status</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Inventory health ratio</p>
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
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#0C1112' : '#ffffff',
                borderColor: theme === 'dark' ? '#202829' : '#e2e8f0',
                borderRadius: '12px',
                color: theme === 'dark' ? '#fff' : '#0f172a',
              }}
              formatter={(val) => [`${val}%`, 'Share']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{inStockPercent}%</span>
          <span className="text-[11px] text-[#08D9C0] font-semibold uppercase tracking-wider">In Stock</span>
        </div>
      </div>

      <div className={`grid grid-cols-3 gap-2 pt-2 border-t ${theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'} text-center`}>
        {stockStatusData.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{item.name}</span>
            </div>
            <p className={`text-sm font-bold mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.value}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
