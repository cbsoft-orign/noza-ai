import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, User, ArrowRight, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import { getTranslations } from '../data/translations';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import logoImg from '../assets/nozalogo_b2dda888.png';

export default function SignUp() {
  const navigate = useNavigate();
  const { acceptAuthentication, theme, toggleTheme, lang } = useApp();
  const dark = theme === 'dark';
  const t = getTranslations(lang);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('Nyabugogo');
  const [error, setError] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(apiUrl('/api/shop'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: shopName, phone, village, ownerName }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || t.auth.couldNotCreateShop);
        return;
      }
      acceptAuthentication(data.shop, data.user);
      navigate('/dashboard');
    } catch {
      setError(t.auth.backendUnavailable);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 selection:bg-teal-200 selection:text-teal-950 ${dark ? 'bg-[#07090a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`w-full max-w-lg border rounded-2xl p-6 sm:p-8 ${dark ? 'bg-[#111516] border-[#202829]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label={t.auth.backToHome}
            className="flex items-center focus:outline-none"
          >
            <img src={logoImg} alt="NOZA Logo" className="h-10 w-auto object-contain" />
          </button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? t.common.switchToLight : t.common.switchToDark}
              className={`p-2 rounded-lg ${dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h1 className={`font-semibold text-xl ${dark ? 'text-white' : 'text-slate-900'}`}>{t.auth.signUpTitle}</h1>
          <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t.auth.signUpSubtitle}</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {error && <p role="alert" className={`text-sm ${dark ? 'text-red-400' : 'text-red-700'}`}>{error}</p>}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.auth.shopNameLabel}</label>
            <div className="relative">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={t.auth.shopNamePlaceholder}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#087e73]/20 focus:border-[#087e73] ${
                  dark ? 'bg-[#07090a] border-[#202829] text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.auth.ownerNameLabel}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder={t.auth.ownerNamePlaceholder}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#087e73]/20 focus:border-[#087e73] ${
                  dark ? 'bg-[#07090a] border-[#202829] text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.auth.whatsappPhoneLabel}</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.auth.whatsappPhonePlaceholder}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#087e73]/20 focus:border-[#087e73] ${
                  dark ? 'bg-[#07090a] border-[#202829] text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.auth.villageLabel}</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#087e73]/20 focus:border-[#087e73] ${
                  dark ? 'bg-[#07090a] border-[#202829] text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="Nyabugogo">{t.auth.villages.Nyabugogo}</option>
                <option value="Kicukiro">{t.auth.villages.Kicukiro}</option>
                <option value="Kimironko">{t.auth.villages.Kimironko}</option>
              </select>
            </div>
          </div>

          <div className={`p-4 rounded-lg border flex items-start gap-3 ${dark ? 'bg-[#0c1112] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${dark ? 'text-[#08d9c0]' : 'text-[#087e73]'}`} />
            <p className={`text-xs ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t.auth.freePlanNote}
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#087e73] text-white font-semibold text-sm hover:bg-[#06665e] transition flex items-center justify-center gap-2 mt-2"
          >
            <span>{t.auth.createShopSubmit}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.auth.alreadyHaveShop}{' '}
            <button onClick={() => navigate('/signin')} className={`font-semibold hover:underline ${dark ? 'text-[#08d9c0]' : 'text-[#087e73]'}`}>
              {t.auth.signInLink}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
