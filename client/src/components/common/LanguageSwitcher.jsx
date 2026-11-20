import { Globe } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, theme } = useApp();
  const dark = theme === 'dark';
  const t = getTranslations(lang);

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={`inline-flex items-center rounded-lg border p-0.5 ${
        dark ? 'bg-[#101516] border-[#202829]' : 'bg-slate-100 border-slate-200'
      }`}
    >
      {!compact && (
        <Globe
          className={`w-3.5 h-3.5 ml-2 mr-1.5 shrink-0 ${dark ? 'text-slate-400' : 'text-slate-500'}`}
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        aria-label={t.common.switchToEn}
        className={`px-2 py-1 rounded-md text-xs font-semibold transition ${
          lang === 'en'
            ? dark
              ? 'bg-[#08D9C0] text-black'
              : 'bg-[#087E73] text-white'
            : dark
            ? 'text-slate-300 hover:text-white'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('rw')}
        aria-pressed={lang === 'rw'}
        aria-label={t.common.switchToRw}
        className={`px-2 py-1 rounded-md text-xs font-semibold transition ${
          lang === 'rw'
            ? dark
              ? 'bg-[#08D9C0] text-black'
              : 'bg-[#087E73] text-white'
            : dark
            ? 'text-slate-300 hover:text-white'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        RW
      </button>
    </div>
  );
}
