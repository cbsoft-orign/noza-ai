import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import { getTranslations } from '../data/translations';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import logoImg from '../assets/nozalogo_b2dda888.png';

export default function SignIn() {
  const navigate = useNavigate();
  const { acceptAuthentication, theme, toggleTheme, lang } = useApp();
  const dark = theme === 'dark';
  const t = getTranslations(lang);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || t.auth.shopNotFound);
        return;
      }
      acceptAuthentication(data.shop, data.user ?? { id: '', name: '', role: 'owner', phone });
      navigate('/dashboard');
    } catch {
      setError(t.auth.backendUnavailable);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoPhone = () => {
    setPhone('250788000001');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 selection:bg-teal-200 selection:text-teal-950 ${dark ? 'bg-[#07090a] text-white' : 'bg-slate-50 text-slate-900'} animate-fadeIn`}>
      <div className={`w-full max-w-md border rounded-2xl sm:rounded-3xl p-6 sm:p-8 ${dark ? 'bg-[#111516] border-[#202829]' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label={t.auth.backToHome}
            className="flex items-center focus:outline-none"
          >
            <img src={logoImg} alt="NOZA Logo" className="h-9 sm:h-10 w-auto object-contain" />
          </button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? t.common.switchToLight : t.common.switchToDark}
              className={`p-2 rounded-xl transition ${dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {dark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h1 className={`font-extrabold text-xl sm:text-2xl ${dark ? 'text-white' : 'text-slate-900'}`}>{t.auth.signInTitle}</h1>
          <p className={`text-xs sm:text-sm mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t.auth.signInSubtitle}</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          {error && <p role="alert" className="text-xs sm:text-sm text-red-500 font-semibold">{error}</p>}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.auth.shopPhoneLabel}</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.auth.shopPhonePlaceholder}
                className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                  dark ? 'bg-[#07090a] border-[#202829] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                required
              />
            </div>
            <p className={`text-[11px] mt-1.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t.auth.shopPhoneHint}</p>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${dark ? 'bg-[#0c1112] border-[#202829]' : 'bg-teal-50/60 border-teal-100'}`}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`w-5 h-5 shrink-0 ${dark ? 'text-[#08d9c0]' : 'text-[#087e73]'}`} />
              <p className={`text-xs ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.auth.demoInfo}</p>
            </div>
            <button
              type="button"
              onClick={fillDemoPhone}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition shrink-0 active:scale-95 self-start sm:self-auto ${
                dark
                  ? 'bg-[#08D9C0]/15 border-[#08D9C0]/40 text-[#08D9C0] hover:bg-[#08D9C0]/25'
                  : 'bg-white border-teal-300 text-[#087e73] hover:bg-teal-100'
              }`}
            >
              Fill Demo
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-extrabold text-sm sm:text-base hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#08D9C0]/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t.auth.enterDashboard}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-xs sm:text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.auth.noShopYet}{' '}
            <button onClick={() => navigate('/signup')} className={`font-bold hover:underline ${dark ? 'text-[#08d9c0]' : 'text-[#087e73]'}`}>
              {t.auth.createShopLink}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
