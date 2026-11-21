import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { BarChart2, ChevronDown, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { buildSalesChartData } from './salesChartData';
import { getTranslations } from '../../data/translations';

export default function SalesLineChart() {
  const { theme, sales, lang } = useApp();
  const navigate = useNavigate();
  const t = getTranslations(lang);
  const dark = theme === 'dark';
  const [rangeDays, setRangeDays] = useState(30);
  const chartData = useMemo(() => buildSalesChartData(sales, rangeDays), [rangeDays, sales]);
  const hasSales = chartData.some((day) => day.count > 0);

  return (
    <div
      className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-sm transition-colors ${
        dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm sm:text-base ${dark ? 'text-white' : 'text-slate-900'}`}>
              {t.dashboard.salesOverview}
            </h3>
            <p className={`text-[11px] sm:text-xs ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
              {t.dashboard.revenueProfitTracking}
            </p>
          </div>
        </div>

        <div className="relative shrink-0">
          <select
            aria-label={t.dashboard.dateRangeAria}
            value={rangeDays}
            onChange={(event) => setRangeDays(Number(event.target.value))}
            className={`appearance-none flex items-center gap-2 pl-3 pr-8 py-1.5 rounded-xl border text-xs font-semibold transition ${
              dark
                ? 'bg-[#07090A] border-[#202829] text-[#B4BABB] hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            <option value={7}>{t.dashboard.last7Days}</option>
            <option value={30}>{t.dashboard.last30Days}</option>
            <option value={90}>{t.dashboard.last90Days}</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-slate-400" />
        </div>
      </div>

      <div className="h-[220px] sm:h-[260px] w-full">
        {hasSales ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#08D9C0" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#08D9C0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818CF8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#202829' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="date" stroke={dark ? '#747E80' : '#94a3b8'} fontSize={11} tickLine={false} />
              <YAxis
                stroke={dark ? '#747E80' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
                  return value.toLocaleString();
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: dark ? '#0C1112' : '#ffffff',
                  borderColor: dark ? '#202829' : '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                  fontSize: '12px',
                  color: dark ? '#fff' : '#0f172a',
                }}
                formatter={(value, name) => [
                  `RWF ${Number(value).toLocaleString()}`,
                  name === 'sales' ? t.dashboard.revenue : t.dashboard.profit,
                ]}
              />
              <Legend formatter={(value) => (value === 'sales' ? t.dashboard.revenue : t.dashboard.profit)} />
              <Area type="monotone" dataKey="sales" stroke="#08D9C0" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGradient)" />
              <Area type="monotone" dataKey="profit" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#profitGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-4">
            <p className={`text-xs sm:text-sm ${dark ? 'text-[#747E80]' : 'text-slate-500'}`}>
              {t.dashboard.noSalesInDays(rangeDays)}
            </p>
            <button
              type="button"
              onClick={() => navigate('/pos')}
              className="px-4 py-2 rounded-xl bg-[#087E73] text-white text-xs font-bold hover:bg-[#06665e] transition flex items-center gap-1.5 active:scale-95 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'rw' ? 'Kora igurisha rya mbere' : 'Record first sale'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
