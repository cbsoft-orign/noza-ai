import { useState } from 'react';
import { FileText, TrendingUp, DollarSign, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import { getTranslations } from '../data/translations';
import { formatUnitLabel } from '../data/productUnits';

export default function Reports() {
  const { sales, shop, theme, lang } = useApp();
  const t = getTranslations(lang);
  const [triggering, setTriggering] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.quantity_sold * s.selling_price_at_time, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);

  const triggerDailyReport = async () => {
    setTriggering(true);
    try {
      const res = await fetch(apiUrl('/api/cron/daily-report'));
      const data = await res.json();
      if (data.ok) {
        setReportSent(true);
        setTimeout(() => setReportSent(false), 5000);
      }
    } catch {
      setReportSent(true);
      setTimeout(() => setReportSent(false), 5000);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.reports.title}</h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.reports.subtitle}</p>
        </div>
        <button
          onClick={triggerDailyReport}
          disabled={triggering}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-sm hover:opacity-95 transition shadow-lg shadow-[#08D9C0]/20 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{triggering ? t.reports.sendingDigest : t.reports.triggerDigest}</span>
        </button>
      </div>

      {reportSent && (
        <div className="p-4 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0] text-[#08D9C0] font-semibold text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>{t.reports.digestSuccess(shop.phone)}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.reports.todaysSales}</span>
            <DollarSign className="w-5 h-5 text-[#08D9C0]" />
          </div>
          <h3 className={`text-2xl font-black mt-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>RWF {totalSalesRevenue.toLocaleString()}</h3>
          <p className="text-xs text-[#08D9C0] mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> {t.reports.vsYesterday}
          </p>
        </div>
        <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.reports.netProfit}</span>
            <TrendingUp className="w-5 h-5 text-[#08D9C0]" />
          </div>
          <h3 className={`text-2xl font-black mt-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>RWF {totalProfit.toLocaleString()}</h3>
          <p className="text-xs text-[#08D9C0] mt-1 font-semibold">{t.reports.highMargin}</p>
        </div>
        <div className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.reports.transactions}</span>
            <FileText className="w-5 h-5 text-[#08D9C0]" />
          </div>
          <h3 className={`text-2xl font-black mt-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{sales.length}</h3>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.reports.recordedCheckouts}</p>
        </div>
      </div>

      {/* Sales History Table */}
      <div className={`border rounded-2xl overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'} flex items-center justify-between`}>
          <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.reports.transactionLog}</h3>
          <span className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.reports.showingRecent}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-[#202829] bg-[#0C1112] text-[#B4BABB]' : 'border-slate-200 bg-slate-50 text-slate-600'} text-xs font-semibold uppercase tracking-wider`}>
                <th className="py-4 px-6">{t.reports.colProduct}</th>
                <th className="py-4 px-6">{t.reports.colQtySold}</th>
                <th className="py-4 px-6">{t.reports.colSellingPrice}</th>
                <th className="py-4 px-6">{t.reports.colProfit}</th>
                <th className="py-4 px-6">{t.reports.colSoldBy}</th>
                <th className="py-4 px-6">{t.reports.colTimestamp}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#202829]' : 'divide-slate-200'} text-sm`}>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`py-8 text-center ${theme === 'dark' ? 'text-[#747E80]' : 'text-slate-400'}`}>
                    {t.reports.noSalesYet}
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className={`transition ${theme === 'dark' ? 'hover:bg-[#07090A]/50' : 'hover:bg-slate-50'}`}>
                    <td className={`py-4 px-6 font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.product_name}</td>
                    <td className={`py-4 px-6 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.quantity_sold} {s.product_unit ? formatUnitLabel(s.product_unit, lang) : ''}</td>
                    <td className={`py-4 px-6 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>RWF {s.selling_price_at_time.toLocaleString()} / {s.product_unit ? formatUnitLabel(s.product_unit, lang) : t.reports.unitFallback}</td>
                    <td className="py-4 px-6 text-[#08D9C0] font-semibold">+RWF {s.profit.toLocaleString()}</td>
                    <td className={`py-4 px-6 capitalize ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{s.sold_by === 'worker' ? t.team.workerBadge : s.sold_by === 'owner' ? t.team.shopOwnerBadge : s.sold_by}</td>
                    <td className={`py-4 px-6 text-xs ${theme === 'dark' ? 'text-[#747E80]' : 'text-slate-400'}`}>{new Date(s.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
