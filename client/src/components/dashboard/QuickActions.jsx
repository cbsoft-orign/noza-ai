import { Rocket, Package, ShoppingCart, FileText, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';

export default function QuickActions() {
  const navigate = useNavigate();
  const { theme, lang } = useApp();
  const t = getTranslations(lang);
  const dark = theme === 'dark';

  const actions = [
    {
      id: 'add-product',
      label: t.dashboard.actionAddProduct,
      icon: Package,
      path: '/products',
      color: 'from-[#087E73] to-[#08D9C0]',
    },
    {
      id: 'record-sale',
      label: t.dashboard.actionRecordSale,
      icon: ShoppingCart,
      path: '/pos',
      color: 'from-[#087E73]/80 to-[#08D9C0]/80',
    },
    {
      id: 'view-reports',
      label: t.dashboard.actionViewReports,
      icon: FileText,
      path: '/reports',
      color: dark ? 'from-[#101516] to-[#0C1112]' : 'from-slate-100 to-slate-200',
      border: true,
    },
    {
      id: 'voice-ai',
      label: t.dashboard.actionVoiceAI,
      icon: Bot,
      path: '/pos#voice-assistant',
      color: 'from-[#087E73] to-[#08D9C0]',
    },
  ];

  return (
    <div
      className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-sm transition-colors ${
        dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] shrink-0">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold text-sm sm:text-base ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.dashboard.quickActions}
          </h3>
          <p className={`text-[11px] sm:text-xs ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
            {t.dashboard.dailyShortcuts}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {actions.map((act) => {
          const IconC = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => navigate(act.path)}
              className={`p-3.5 sm:p-4 rounded-2xl flex flex-col items-start justify-between gap-3 bg-gradient-to-br ${act.color} text-black font-semibold hover:opacity-95 transition-all active:scale-95 shadow-md text-left group ${
                act.border ? dark ? 'border border-[#202829]' : 'border border-slate-300' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <IconC className="w-4 h-4" />
              </div>
              <span className={`text-xs sm:text-sm font-extrabold tracking-tight ${act.border && !dark ? 'text-slate-900' : 'text-white'}`}>
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
