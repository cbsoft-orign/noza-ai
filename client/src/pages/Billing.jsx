import { useState } from 'react';
import { CreditCard, CheckCircle2, Zap, Smartphone, Check } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import { getTranslations } from '../data/translations';

export default function Billing() {
  const { shop, upgradePlan, theme, lang } = useApp();
  const t = getTranslations(lang);
  const dark = theme === 'dark';
  const [selectedPlan, setSelectedPlan] = useState('200_daily');
  const [phone, setPhone] = useState(shop.phone || '250788000001');
  const [momoRef, setMomoRef] = useState(() => `MOMO-${Math.floor(100000 + Math.random() * 900000)}`);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleGenerateRef = () => {
    setMomoRef(`MOMO-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setProcessing(true);
    const amount = selectedPlan === '5000_monthly' ? 5000 : 200;
    try {
      const res = await fetch(apiUrl('/api/payments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phone || shop.phone,
          type: selectedPlan,
          amount,
          momo_ref: momoRef || `MOMO-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        upgradePlan(selectedPlan);
        setSuccessMsg(t.billing.upgradeSuccess(selectedPlan));
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.message || t.billing.paymentFailed);
      }
    } catch {
      setErrorMsg(t.auth.backendUnavailable);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h2 className={`text-2xl sm:text-3xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>
          {t.billing.title}
        </h2>
        <p className={`text-xs sm:text-sm mt-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
          {t.billing.subtitle}
        </p>
      </div>

      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0] text-[#08D9C0] font-semibold text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn shadow-lg shadow-[#08D9C0]/10"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-400 font-semibold text-xs sm:text-sm shadow-md"
        >
          {errorMsg}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Starter Free Plan */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between shadow-sm ${
            shop.plan === 'free'
              ? 'border-[#08D9C0] ring-1 ring-[#08D9C0]/50'
              : dark
              ? 'border-[#202829]'
              : 'border-slate-200'
          } ${dark ? 'bg-[#101516]' : 'bg-white'}`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
                {t.billing.starter}
              </span>
              {shop.plan === 'free' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#08D9C0]/20 text-[#08D9C0]">
                  {t.billing.currentActive}
                </span>
              )}
            </div>
            <h3 className={`text-xl sm:text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
              {t.billing.freePlan}
            </h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
              {t.billing.freeDesc}
            </p>
            <ul className={`space-y-2 mt-5 text-xs sm:text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#08D9C0] shrink-0" /> {t.billing.freeFeat1}</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#08D9C0] shrink-0" /> {t.billing.freeFeat2}</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#08D9C0] shrink-0" /> {t.billing.freeFeat3}</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#202829]">
            <span className="text-xs font-bold text-[#08D9C0] block text-center">
              {shop.plan === 'free' ? t.billing.currentActive : 'Free Tier'}
            </span>
          </div>
        </div>

        {/* Daily MoMo Plan */}
        <div
          onClick={() => setSelectedPlan('200_daily')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm relative ${
            selectedPlan === '200_daily'
              ? 'border-[#08D9C0] ring-2 ring-[#08D9C0] shadow-lg shadow-[#08D9C0]/15'
              : dark
              ? 'border-[#202829] hover:border-slate-700'
              : 'border-slate-200 hover:border-slate-300'
          } ${dark ? 'bg-[#101516]' : 'bg-white'}`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#08D9C0]">
                {t.billing.popularDaily}
              </span>
              {selectedPlan === '200_daily' && (
                <div className="w-5 h-5 rounded-full bg-[#08D9C0] text-black flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>
            <h3 className={`text-xl sm:text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
              200 RWF <span className={`text-xs font-normal ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.billing.perDay}</span>
            </h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
              {t.billing.dailyDesc}
            </p>
            <ul className={`space-y-2 mt-5 text-xs sm:text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#08D9C0] shrink-0" /> {t.billing.dailyFeat1}</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#08D9C0] shrink-0" /> {t.billing.dailyFeat2}</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#08D9C0] shrink-0" /> {t.billing.dailyFeat3}</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPlan('200_daily');
            }}
            className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all mt-6 active:scale-95 ${
              selectedPlan === '200_daily'
                ? 'bg-[#08D9C0] text-black shadow-md shadow-[#08D9C0]/20'
                : dark
                ? 'bg-[#07090A] border border-[#202829] text-white hover:border-[#08D9C0]'
                : 'bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#087E73]'
            }`}
          >
            {t.billing.selectDaily}
          </button>
        </div>

        {/* Monthly MoMo Plan */}
        <div
          onClick={() => setSelectedPlan('5000_monthly')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm relative ${
            selectedPlan === '5000_monthly'
              ? 'border-[#08D9C0] ring-2 ring-[#08D9C0] shadow-lg shadow-[#08D9C0]/15'
              : dark
              ? 'border-[#202829] hover:border-slate-700'
              : 'border-slate-200 hover:border-slate-300'
          } ${dark ? 'bg-[#101516]' : 'bg-white'}`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {t.billing.bestValue}
              </span>
              {selectedPlan === '5000_monthly' && (
                <div className="w-5 h-5 rounded-full bg-[#08D9C0] text-black flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>
            <h3 className={`text-xl sm:text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
              5,000 RWF <span className={`text-xs font-normal ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.billing.perMonth}</span>
            </h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
              {t.billing.monthlyDesc}
            </p>
            <ul className={`space-y-2 mt-5 text-xs sm:text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#08D9C0] shrink-0" /> {t.billing.monthlyFeat1}</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#08D9C0] shrink-0" /> {t.billing.monthlyFeat2}</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#08D9C0] shrink-0" /> {t.billing.monthlyFeat3}</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPlan('5000_monthly');
            }}
            className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all mt-6 active:scale-95 ${
              selectedPlan === '5000_monthly'
                ? 'bg-[#08D9C0] text-black shadow-md shadow-[#08D9C0]/20'
                : dark
                ? 'bg-[#07090A] border border-[#202829] text-white hover:border-[#08D9C0]'
                : 'bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#087E73]'
            }`}
          >
            {t.billing.selectMonthly}
          </button>
        </div>
      </div>

      {/* MTN MoMo Payment Form */}
      <div
        className={`border rounded-3xl p-5 sm:p-8 max-w-xl mx-auto shadow-sm transition-colors ${
          dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-base sm:text-lg ${dark ? 'text-white' : 'text-slate-900'}`}>
              {t.billing.payTitle}
            </h3>
            <p className={`text-xs ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
              {t.billing.selectedPrefix} {selectedPlan === '5000_monthly' ? t.billing.selectedMonthly : t.billing.selectedDaily}
            </p>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
              {t.billing.shopPhoneLabel}
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="250788000001"
                className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                  dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                {t.billing.momoRefLabel}
              </label>
              <button
                type="button"
                onClick={handleGenerateRef}
                className="text-[11px] text-[#08D9C0] hover:underline font-semibold"
              >
                {lang === 'rw' ? 'Hindura Code' : 'Generate New'}
              </button>
            </div>
            <input
              type="text"
              value={momoRef}
              onChange={(e) => setMomoRef(e.target.value)}
              placeholder="MOMO-REF-994821"
              className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                dark ? 'bg-[#07090A] border-[#202829] text-white placeholder-[#747E80]' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
              required
            />
          </div>

          {/* Info pill about MTN MoMo Push */}
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 ${
              dark ? 'bg-[#07090A] border-[#202829] text-slate-300' : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <Smartphone className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="leading-relaxed">
              {lang === 'rw'
                ? 'Uzakira ubutumwa bwa MTN MoMo kuri terefone yawe bwo kwemeza umubare w’amafaranga n’umubare w’ibanga (PIN).'
                : 'You will receive an MTN MoMo prompt on your phone to confirm the payment with your PIN.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-extrabold text-sm sm:text-base hover:opacity-95 transition-all shadow-lg shadow-[#08D9C0]/20 flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            <span>{processing ? t.common.processing : t.billing.authorizeBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
