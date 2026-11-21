import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';

export default function WelcomeHeader() {
  const { lang, user, shop, theme } = useApp();
  const navigate = useNavigate();
  const t = getTranslations(lang);
  const dark = theme === 'dark';

  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          {t.dashboard.welcomeBack}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#087E73] to-[#08D9C0]">
            {user.name || 'Owner'}!
          </span>
        </h2>
        <p className={`text-xs sm:text-sm mt-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
          {t.dashboard.subtitle(shop.name || 'Duka', shop.village || 'Kigali')}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => navigate('/billing')}
          className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 shadow-sm transition active:scale-95 ${
            dark ? 'bg-[#101516] border-[#202829] hover:border-[#08D9C0]' : 'bg-white border-slate-200 hover:border-teal-300'
          }`}
        >
          <span className={`text-[11px] ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.dashboard.planLabel}</span>
          <span className="text-xs font-extrabold uppercase text-[#08D9C0] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {shop.plan}{t.dashboard.planSuffix ? ` ${t.dashboard.planSuffix}` : ''}
          </span>
        </button>

        <div
          className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 shadow-sm ${
            dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
          }`}
        >
          <span className={`text-[11px] ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.dashboard.creditsLabel}</span>
          <span className={`text-xs font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.dashboard.creditsLeft(shop.credits)}
          </span>
        </div>
      </div>
    </div>
  );
}
