import { useState } from 'react';
import { CreditCard, CheckCircle2, Zap } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import { getTranslations } from '../data/translations';

export default function Billing() {
  const { shop, upgradePlan, theme, lang } = useApp();
  const t = getTranslations(lang);
  const [selectedPlan, setSelectedPlan] = useState('200_daily');
  const [momoRef, setMomoRef] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const amount = selectedPlan === '5000_monthly' ? 5000 : 200;
    try {
      const res = await fetch(apiUrl('/api/payments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: shop.phone,
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
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.billing.title}</h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.billing.subtitle}</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0] text-[#08D9C0] font-semibold text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-400 font-semibold text-sm">
          {errorMsg}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-3xl border transition flex flex-col justify-between shadow-sm ${shop.plan === 'free' ? 'border-[#08D9C0]' : theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'} ${theme === 'dark' ? 'bg-[#101516]' : 'bg-white'}`}>
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.billing.starter}</span>
            <h3 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.billing.freePlan}</h3>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.billing.freeDesc}</p>
            <ul className={`space-y-2.5 mt-6 text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <li className="flex items-center gap-2">✓ {t.billing.freeFeat1}</li>
              <li className="flex items-center gap-2">✓ {t.billing.freeFeat2}</li>
              <li className="flex items-center gap-2">✓ {t.billing.freeFeat3}</li>
            </ul>
          </div>
          <div className="mt-8">
            <span className="text-xs font-bold text-[#08D9C0]">{t.billing.currentActive}</span>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border transition flex flex-col justify-between shadow-sm ${selectedPlan === '200_daily' ? 'border-[#08D9C0]' : theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'} ${theme === 'dark' ? 'bg-[#101516]' : 'bg-white'}`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#08D9C0]">{t.billing.popularDaily}</span>
            <h3 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>200 RWF <span className={`text-xs font-normal ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.billing.perDay}</span></h3>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.billing.dailyDesc}</p>
            <ul className={`space-y-2.5 mt-6 text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <li className="flex items-center gap-2">✓ {t.billing.dailyFeat1}</li>
              <li className="flex items-center gap-2">✓ {t.billing.dailyFeat2}</li>
              <li className="flex items-center gap-2">✓ {t.billing.dailyFeat3}</li>
            </ul>
          </div>
          <button
            onClick={() => setSelectedPlan('200_daily')}
            className={`w-full py-3 rounded-xl font-bold text-sm transition mt-8 ${selectedPlan === '200_daily' ? 'bg-[#08D9C0] text-black shadow-lg shadow-[#08D9C0]/20' : theme === 'dark' ? 'bg-[#07090A] border border-[#202829] text-white hover:border-[#08D9C0]' : 'bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#087E73]'}`}
          >
            {t.billing.selectDaily}
          </button>
        </div>

        <div className={`p-6 rounded-3xl border transition flex flex-col justify-between shadow-sm ${selectedPlan === '5000_monthly' ? 'border-[#08D9C0]' : theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'} ${theme === 'dark' ? 'bg-[#101516]' : 'bg-white'}`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#08D9C0]">{t.billing.bestValue}</span>
            <h3 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>5,000 RWF <span className={`text-xs font-normal ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.billing.perMonth}</span></h3>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.billing.monthlyDesc}</p>
            <ul className={`space-y-2.5 mt-6 text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <li className="flex items-center gap-2">✓ {t.billing.monthlyFeat1}</li>
              <li className="flex items-center gap-2">✓ {t.billing.monthlyFeat2}</li>
              <li className="flex items-center gap-2">✓ {t.billing.monthlyFeat3}</li>
            </ul>
          </div>
          <button
            onClick={() => setSelectedPlan('5000_monthly')}
            className={`w-full py-3 rounded-xl font-bold text-sm transition mt-8 ${selectedPlan === '5000_monthly' ? 'bg-[#08D9C0] text-black shadow-lg shadow-[#08D9C0]/20' : theme === 'dark' ? 'bg-[#07090A] border border-[#202829] text-white hover:border-[#08D9C0]' : 'bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#087E73]'}`}
          >
            {t.billing.selectMonthly}
          </button>
        </div>
      </div>

      {/* MTN MoMo Payment Form */}
      <div className={`border rounded-3xl p-8 max-w-xl mx-auto shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.billing.payTitle}</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
              {t.billing.selectedPrefix} {selectedPlan === '5000_monthly' ? t.billing.selectedMonthly : t.billing.selectedDaily}
            </p>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.billing.shopPhoneLabel}</label>
            <input
              type="text"
              defaultValue={shop.phone}
              className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              required
            />
          </div>
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.billing.momoRefLabel}</label>
            <input
              type="text"
              value={momoRef}
              onChange={(e) => setMomoRef(e.target.value)}
              placeholder="MOMO-REF-994821"
              className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white placeholder-[#747E80]' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-[#08D9C0]/20 flex items-center justify-center gap-2 mt-4"
          >
            <Zap className="w-4 h-4" />
            <span>{t.billing.authorizeBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
