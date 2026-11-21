import { useState } from 'react';
import { FileText, TrendingUp, DollarSign, Send, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import { getTranslations } from '../data/translations';
import { formatUnitLabel } from '../data/productUnits';

export default function Reports() {
  const { sales, shop, theme, lang } = useApp();
  const t = getTranslations(lang);
  const dark = theme === 'dark';
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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.reports.title}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
            {t.reports.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={triggerDailyReport}
          disabled={triggering}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs sm:text-sm hover:opacity-95 transition-all shadow-lg shadow-[#08D9C0]/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {triggering ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>{triggering ? t.reports.sendingDigest : t.reports.triggerDigest}</span>
        </button>
      </div>

      {reportSent && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0] text-[#08D9C0] font-semibold text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn shadow-lg shadow-[#08D9C0]/10"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{t.reports.digestSuccess(shop.phone)}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div
          className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-sm transition-colors ${
            dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs sm:text-sm font-medium ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
              {t.reports.todaysSales}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-xl sm:text-2xl font-black mt-3 tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
            RWF {totalSalesRevenue.toLocaleString()}
          </h3>
          <p className="text-xs text-[#08D9C0] mt-1.5 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> {t.reports.vsYesterday}
          </p>
        </div>

        <div
          className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-sm transition-colors ${
            dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs sm:text-sm font-medium ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
              {t.reports.netProfit}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-xl sm:text-2xl font-black mt-3 tracking-tight ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`}>
            +RWF {totalProfit.toLocaleString()}
          </h3>
          <p className="text-xs text-[#08D9C0] mt-1.5 font-semibold">{t.reports.highMargin}</p>
        </div>

        <div
          className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-sm transition-colors ${
            dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs sm:text-sm font-medium ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
              {t.reports.transactions}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-xl sm:text-2xl font-black mt-3 tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
            {sales.length}
          </h3>
          <p className={`text-xs mt-1.5 ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
            {t.reports.recordedCheckouts}
          </p>
        </div>
      </div>

      {/* Transaction Log Container */}
      <div
        className={`border rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm transition-colors ${
          dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`p-4 sm:p-6 border-b flex items-center justify-between ${
            dark ? 'border-[#202829]' : 'border-slate-200'
          }`}
        >
          <h3 className={`font-bold text-sm sm:text-base ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.reports.transactionLog}
          </h3>
          <span className={`text-xs ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
            {t.reports.showingRecent}
          </span>
        </div>

        {/* ============================================================ */}
        {/* MOBILE VIEW (< md): Responsive Transaction Cards */}
        {/* ============================================================ */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#202829]">
          {sales.length === 0 ? (
            <div className={`py-12 text-center text-xs sm:text-sm ${dark ? 'text-[#747E80]' : 'text-slate-400'}`}>
              {t.reports.noSalesYet}
            </div>
          ) : (
            sales.map((s) => (
              <div key={s.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#087E73]/20 text-[#08D9C0] flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {s.product_name}
                      </h4>
                      <p className={`text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {s.quantity_sold} {s.product_unit ? formatUnitLabel(s.product_unit, lang) : ''} · {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>
                      RWF {(s.quantity_sold * s.selling_price_at_time).toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold text-[#08D9C0]">
                      +RWF {s.profit.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className={`capitalize px-2 py-0.5 rounded-full border ${
                    dark ? 'bg-[#07090A] border-[#202829] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    {s.sold_by === 'worker' ? t.team.workerBadge : s.sold_by === 'owner' ? t.team.shopOwnerBadge : s.sold_by}
                  </span>
                  <span className={dark ? 'text-slate-500' : 'text-slate-400'}>
                    RWF {s.selling_price_at_time.toLocaleString()} / {s.product_unit ? formatUnitLabel(s.product_unit, lang) : t.reports.unitFallback}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ============================================================ */}
        {/* DESKTOP / TABLET VIEW (md+): Full Multi-Column Table */}
        {/* ============================================================ */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b text-xs font-semibold uppercase tracking-wider ${
                  dark ? 'border-[#202829] bg-[#0C1112] text-[#B4BABB]' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <th className="py-4 px-6">{t.reports.colProduct}</th>
                <th className="py-4 px-6">{t.reports.colQtySold}</th>
                <th className="py-4 px-6">{t.reports.colSellingPrice}</th>
                <th className="py-4 px-6">{t.reports.colProfit}</th>
                <th className="py-4 px-6">{t.reports.colSoldBy}</th>
                <th className="py-4 px-6">{t.reports.colTimestamp}</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${dark ? 'divide-[#202829]' : 'divide-slate-200'}`}>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`py-12 text-center ${dark ? 'text-[#747E80]' : 'text-slate-400'}`}>
                    {t.reports.noSalesYet}
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr
                    key={s.id}
                    className={`transition ${dark ? 'hover:bg-[#07090A]/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className={`py-4 px-6 font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
                      {s.product_name}
                    </td>
                    <td className={`py-4 px-6 font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                      {s.quantity_sold} {s.product_unit ? formatUnitLabel(s.product_unit, lang) : ''}
                    </td>
                    <td className={`py-4 px-6 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                      RWF {s.selling_price_at_time.toLocaleString()} / {s.product_unit ? formatUnitLabel(s.product_unit, lang) : t.reports.unitFallback}
                    </td>
                    <td className="py-4 px-6 text-[#08D9C0] font-semibold">
                      +RWF {s.profit.toLocaleString()}
                    </td>
                    <td className={`py-4 px-6 capitalize ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                      {s.sold_by === 'worker' ? t.team.workerBadge : s.sold_by === 'owner' ? t.team.shopOwnerBadge : s.sold_by}
                    </td>
                    <td className={`py-4 px-6 text-xs ${dark ? 'text-[#747E80]' : 'text-slate-400'}`}>
                      {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
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
