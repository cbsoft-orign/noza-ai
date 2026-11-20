import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';

export default function WelcomeHeader() {
  const { lang, user, shop, theme } = useApp();
  const t = getTranslations(lang);

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className={`text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.dashboard.welcomeBack}{' '}
          <span className="text-[#08D9C0]">{user.name}!</span>
        </h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
          {t.dashboard.subtitle(shop.name, shop.village)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.dashboard.planLabel}</span>
          <span className="text-xs font-bold uppercase text-[#08D9C0]">
            {shop.plan}{t.dashboard.planSuffix ? ` ${t.dashboard.planSuffix}` : ''}
          </span>
        </div>
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.dashboard.creditsLabel}</span>
          <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.dashboard.creditsLeft(shop.credits)}</span>
        </div>
      </div>
    </div>
  );
}
