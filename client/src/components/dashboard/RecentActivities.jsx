import { Zap, Package, User, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';

export default function RecentActivities() {
  const { activities, theme, lang } = useApp();
  const t = getTranslations(lang);
  const dark = theme === 'dark';

  return (
    <div
      className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-sm transition-colors ${
        dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold text-sm sm:text-base ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.dashboard.recentActivities}
          </h3>
          <p className={`text-[11px] sm:text-xs ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
            {t.dashboard.liveEventLog}
          </p>
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {activities.length === 0 ? (
          <p className={`text-xs sm:text-sm py-8 text-center ${dark ? 'text-[#747E80]' : 'text-slate-500'}`}>
            {t.dashboard.noActivities}
          </p>
        ) : (
          activities.slice(0, 4).map((act, idx) => (
            <div
              key={act.id || idx}
              className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition ${
                dark ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[#08D9C0] shrink-0 ${
                    dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
                  }`}
                >
                  {act.type === 'sale' ? (
                    <ShoppingCart className="w-4 h-4" />
                  ) : act.type === 'customer' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                </div>
                <p className={`text-xs sm:text-sm font-semibold truncate ${dark ? 'text-white' : 'text-slate-800'}`}>
                  {act.text}
                </p>
              </div>
              <span className={`text-[11px] ${dark ? 'text-[#747E80]' : 'text-slate-400'} shrink-0`}>
                {act.time}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
