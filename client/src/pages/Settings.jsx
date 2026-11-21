import { useState } from 'react';
import { Store, Globe, CheckCircle2, RefreshCw, Server, MapPin, Phone } from 'lucide-react';
import { useApp } from '../context/useApp';
import { getTranslations } from '../data/translations';
import { apiUrl } from '../api';

export default function Settings() {
  const { shop, setShop, lang, setLang, backendStatus, theme } = useApp();
  const t = getTranslations(lang);
  const dark = theme === 'dark';
  const [shopName, setShopName] = useState(shop.name);
  const [village, setVillage] = useState(shop.village);
  const [success, setSuccess] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(false);
  const [currentBackendStatus, setCurrentBackendStatus] = useState(backendStatus);

  const translatedBackendStatus =
    currentBackendStatus === 'connected'
      ? t.settings.statusConnected
      : currentBackendStatus === 'offline'
      ? t.settings.statusOffline
      : t.settings.statusChecking;

  const handleSave = (e) => {
    e.preventDefault();
    setShop((prev) => ({ ...prev, name: shopName, village }));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  const checkConnection = async () => {
    setCheckingBackend(true);
    try {
      const res = await fetch(apiUrl('/api/health'));
      const data = await res.json();
      setCurrentBackendStatus(data.ok ? 'connected' : 'offline');
    } catch {
      setCurrentBackendStatus('offline');
    } finally {
      setCheckingBackend(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h2 className={`text-2xl sm:text-3xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>
          {t.settings.title}
        </h2>
        <p className={`text-xs sm:text-sm mt-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
          {t.settings.subtitle}
        </p>
      </div>

      {success && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0] text-[#08D9C0] font-semibold text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn shadow-lg shadow-[#08D9C0]/10"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{t.settings.updatedSuccess}</span>
        </div>
      )}

      {/* Shop Profile Form */}
      <div
        className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm transition-colors ${
          dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`flex items-center gap-3 pb-4 border-b ${dark ? 'border-[#202829]' : 'border-slate-100'}`}>
          <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 text-[#08D9C0] flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <h3 className={`font-bold text-base sm:text-lg ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.settings.shopProfile}
          </h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                {t.settings.shopNameLabel}
              </label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                    dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                {t.settings.villageLabel}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                    dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="Nyabugogo">{t.auth.villages.Nyabugogo}</option>
                  <option value="Kicukiro">{t.auth.villages.Kicukiro}</option>
                  <option value="Kimironko">{t.auth.villages.Kimironko}</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
              {t.settings.whatsappPhoneLabel}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={shop.phone}
                disabled
                className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm border cursor-not-allowed ${
                  dark ? 'bg-[#07090A]/50 border-[#202829] text-[#747E80]' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs sm:text-sm hover:opacity-95 transition-all shadow-lg shadow-[#08D9C0]/20 active:scale-95"
            >
              {t.settings.saveChanges}
            </button>
          </div>
        </form>
      </div>

      {/* Integration & Language Settings */}
      <div
        className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm transition-colors ${
          dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`flex items-center gap-3 pb-4 border-b ${dark ? 'border-[#202829]' : 'border-slate-100'}`}>
          <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 text-[#08D9C0] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className={`font-bold text-base sm:text-lg ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.settings.langAndBackend}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
              {t.settings.defaultLangLabel}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all active:scale-95 ${
                  lang === 'en'
                    ? 'bg-[#08D9C0] text-black border-[#08D9C0] shadow-md shadow-[#08D9C0]/20'
                    : dark
                    ? 'bg-[#07090A] text-white border-[#202829] hover:border-slate-700'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                {t.common.english}
              </button>
              <button
                type="button"
                onClick={() => setLang('rw')}
                className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all active:scale-95 ${
                  lang === 'rw'
                    ? 'bg-[#08D9C0] text-black border-[#08D9C0] shadow-md shadow-[#08D9C0]/20'
                    : dark
                    ? 'bg-[#07090A] text-white border-[#202829] hover:border-slate-700'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                {t.common.kinyarwanda}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                {t.settings.backendStatusLabel}
              </label>
              <button
                type="button"
                onClick={checkConnection}
                disabled={checkingBackend}
                className="text-[11px] text-[#08D9C0] hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${checkingBackend ? 'animate-spin' : ''}`} />
                {lang === 'rw' ? 'Ongera ugenzure' : 'Recheck'}
              </button>
            </div>
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                dark ? 'bg-[#07090A] border-[#202829] text-[#B4BABB]' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                {t.settings.proxyLabel}
              </span>
              <span className="text-[#08D9C0] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#08D9C0] animate-pulse" />
                {translatedBackendStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
