import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';

export default function StockDonutChart() {
  const { theme, products, lang } = useApp();
  const t = getTranslations(lang);
  const dark = theme === 'dark';

  const inStock = products.filter((product) => product.quantity > product.low_stock_threshold).length;
  const lowStock = products.filter((product) => product.quantity > 0 && product.quantity <= product.low_stock_threshold).length;
  const outOfStock = products.filter((product) => product.quantity <= 0).length;
  const total = products.length || 1;

  const stockStatusData = [
    { name: t.dashboard.inStock, count: inStock, value: Math.round((inStock / total) * 100), color: '#08d9c0' },
    { name: t.dashboard.lowStock, count: lowStock, value: Math.round((lowStock / total) * 100), color: '#f59e0b' },
    { name: t.dashboard.outOfStock, count: outOfStock, value: Math.round((outOfStock / total) * 100), color: '#ef4444' },
  ];
  const inStockPercent = stockStatusData[0].value;

  return (
    <div
      className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-sm transition-colors ${
        dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] shrink-0">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm sm:text-base ${dark ? 'text-white' : 'text-slate-900'}`}>
              {t.dashboard.stockStatus}
            </h3>
            <p className={`text-[11px] sm:text-xs ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
              {t.dashboard.inventoryHealth}
            </p>
          </div>
        </div>
      </div>

      <div className="relative h-[190px] sm:h-[210px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stockStatusData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {stockStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: dark ? '#0C1112' : '#ffffff',
                borderColor: dark ? '#202829' : '#e2e8f0',
                borderRadius: '12px',
                fontSize: '12px',
                color: dark ? '#fff' : '#0f172a',
              }}
              formatter={(val) => [`${val}%`, t.dashboard.share]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-xl sm:text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
            {inStockPercent}%
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#08D9C0] font-bold uppercase tracking-wider">
            {t.dashboard.inStock}
          </span>
        </div>
      </div>

      <div className={`grid grid-cols-3 gap-1.5 pt-3 border-t ${dark ? 'border-[#202829]' : 'border-slate-100'} text-center`}>
        {stockStatusData.map((item) => (
          <div key={item.name} className="p-1">
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className={`text-[11px] truncate ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
                {item.name}
              </span>
            </div>
            <p className={`text-xs sm:text-sm font-bold mt-0.5 ${dark ? 'text-white' : 'text-slate-900'}`}>
              {item.count} <span className="text-[10px] font-normal opacity-70">({item.value}%)</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
