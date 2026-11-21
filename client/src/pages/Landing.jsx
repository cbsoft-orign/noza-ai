import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Mic, ShieldCheck, ArrowRight, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/useApp';
import { getTranslations } from '../data/translations';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import logoImg from '../assets/nozalogo_b2dda888.png';

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme, lang } = useApp();
  const dark = theme === 'dark';
  const t = getTranslations(lang);

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-teal-200 selection:text-teal-950 ${dark ? 'bg-[#07090A] text-white' : 'bg-slate-50 text-slate-900'} animate-fadeIn`}>
      {/* Header */}
      <header className={`px-3.5 sm:px-6 md:px-8 py-3.5 border-b flex items-center justify-between gap-2 sticky top-0 z-30 backdrop-blur-md transition-colors ${dark ? 'border-[#202829] bg-[#07090A]/95' : 'border-slate-200 bg-white/95'}`}>
        <div className="flex items-center gap-3 shrink-0">
          <img src={logoImg} alt="NOZA Logo" className="h-8 sm:h-10 object-contain" />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? t.common.switchToLight : t.common.switchToDark}
            className={`p-2 rounded-xl transition ${dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {dark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className={`px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition active:scale-95 ${
              dark
                ? 'bg-[#101516] border-[#202829] text-white hover:border-[#08D9C0]'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.landing.signIn}
          </button>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black text-xs sm:text-sm font-extrabold hover:opacity-95 transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-[#08D9C0]/20"
          >
            <span>{t.landing.createShop}</span>
            <ArrowRight className="w-4 h-4 hidden sm:block" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center flex flex-col items-center">
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs mb-6 shadow-sm ${dark ? 'bg-[#101516] border-[#202829] text-[#08D9C0]' : 'bg-teal-50 border-teal-200 text-[#087E73]'}`}>
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="font-semibold">{t.landing.badge}</span>
        </div>

        <h1 className={`text-3xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl leading-[1.15] ${dark ? 'text-white' : 'text-slate-950'}`}>
          {t.landing.heroTitlePrefix}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#087E73] to-[#08D9C0]">
            {t.landing.heroTitleHighlight}
          </span>
        </h1>

        <p className={`text-sm sm:text-base md:text-lg max-w-2xl mt-5 sm:mt-6 leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          {t.landing.heroSubtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mt-8 sm:mt-10 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-extrabold text-sm sm:text-base hover:opacity-95 transition-all shadow-xl shadow-[#08D9C0]/25 flex items-center justify-center gap-2.5 active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{t.landing.launchDashboard}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/pos')}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl border font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-sm ${
              dark
                ? 'bg-[#101516] border-[#202829] text-white hover:border-[#08D9C0]'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Mic className={`w-5 h-5 ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`} />
            <span>{t.landing.testVoiceTill}</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full mt-14 sm:mt-20 text-left">
          <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all ${dark ? 'bg-[#101516] border-[#202829] hover:border-[#08D9C0]/40' : 'bg-white border-slate-200 shadow-sm hover:border-[#087E73]/40'}`}>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${dark ? 'bg-[#087E73]/20 text-[#08D9C0]' : 'bg-teal-50 text-[#087E73]'}`}>
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className={`text-base sm:text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.landing.feature1Title}</h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{t.landing.feature1Desc}</p>
          </div>

          <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all ${dark ? 'bg-[#101516] border-[#202829] hover:border-[#08D9C0]/40' : 'bg-white border-slate-200 shadow-sm hover:border-[#087E73]/40'}`}>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${dark ? 'bg-[#087E73]/20 text-[#08D9C0]' : 'bg-teal-50 text-[#087E73]'}`}>
              <Mic className="w-5 h-5" />
            </div>
            <h3 className={`text-base sm:text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.landing.feature2Title}</h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{t.landing.feature2Desc}</p>
          </div>

          <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all ${dark ? 'bg-[#101516] border-[#202829] hover:border-[#08D9C0]/40' : 'bg-white border-slate-200 shadow-sm hover:border-[#087E73]/40'}`}>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${dark ? 'bg-[#087E73]/20 text-[#08D9C0]' : 'bg-teal-50 text-[#087E73]'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className={`text-base sm:text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.landing.feature3Title}</h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{t.landing.feature3Desc}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-4 sm:px-8 py-5 sm:py-6 border-t text-center text-xs transition-colors ${dark ? 'border-[#202829] text-slate-400 bg-[#07090A]' : 'border-slate-200 text-slate-500 bg-white'}`}>
        <p>{t.landing.footer}</p>
      </footer>
    </div>
  );
}
