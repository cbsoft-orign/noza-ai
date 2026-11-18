import { useState } from 'react';
import { CreditCard, CheckCircle2, Zap } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';

export default function Billing() {
  const { shop, upgradePlan, theme } = useApp();
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
        setSuccessMsg(`Successfully upgraded to ${selectedPlan === '5000_monthly' ? 'Monthly' : 'Daily'} Plan!`);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.message || 'Payment could not be processed.');
      }
    } catch {
      setErrorMsg('Backend unavailable.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Billing & MTN MoMo Plans</h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Upgrade your shop plan to unlock unlimited products and priority AI features.</p>
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
            <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Starter</span>
            <h3 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Free Plan</h3>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Perfect for getting started with basic retail inventory.</p>
            <ul className={`space-y-2.5 mt-6 text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <li className="flex items-center gap-2">✓ Up to 10 products max</li>
              <li className="flex items-center gap-2">✓ 20 starter credits</li>
              <li className="flex items-center gap-2">✓ WhatsApp webhook support</li>
            </ul>
          </div>
          <div className="mt-8">
            <span className="text-xs font-bold text-[#08D9C0]">Current Active Plan</span>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border transition flex flex-col justify-between shadow-sm ${selectedPlan === '200_daily' ? 'border-[#08D9C0]' : theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'} ${theme === 'dark' ? 'bg-[#101516]' : 'bg-white'}`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#08D9C0]">Popular Daily</span>
            <h3 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>200 RWF <span className={`text-xs font-normal ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>/ day</span></h3>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Unlimited products with daily automated WhatsApp digests.</p>
            <ul className={`space-y-2.5 mt-6 text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <li className="flex items-center gap-2">✓ Unlimited products</li>
              <li className="flex items-center gap-2">✓ 25 credits per top-up</li>
              <li className="flex items-center gap-2">✓ Kinyarwanda Voice TTS</li>
            </ul>
          </div>
          <button
            onClick={() => setSelectedPlan('200_daily')}
            className={`w-full py-3 rounded-xl font-bold text-sm transition mt-8 ${selectedPlan === '200_daily' ? 'bg-[#08D9C0] text-black shadow-lg shadow-[#08D9C0]/20' : theme === 'dark' ? 'bg-[#07090A] border border-[#202829] text-white hover:border-[#08D9C0]' : 'bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#087E73]'}`}
          >
            Select Daily Plan
          </button>
        </div>

        <div className={`p-6 rounded-3xl border transition flex flex-col justify-between shadow-sm ${selectedPlan === '5000_monthly' ? 'border-[#08D9C0]' : theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'} ${theme === 'dark' ? 'bg-[#101516]' : 'bg-white'}`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#08D9C0]">Best Value</span>
            <h3 className={`text-2xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>5,000 RWF <span className={`text-xs font-normal ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>/ month</span></h3>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Full access for established shops and multiple workers.</p>
            <ul className={`space-y-2.5 mt-6 text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <li className="flex items-center gap-2">✓ Unlimited products & sales</li>
              <li className="flex items-center gap-2">✓ 200 monthly credits</li>
              <li className="flex items-center gap-2">✓ Priority AI & multi-worker support</li>
            </ul>
          </div>
          <button
            onClick={() => setSelectedPlan('5000_monthly')}
            className={`w-full py-3 rounded-xl font-bold text-sm transition mt-8 ${selectedPlan === '5000_monthly' ? 'bg-[#08D9C0] text-black shadow-lg shadow-[#08D9C0]/20' : theme === 'dark' ? 'bg-[#07090A] border border-[#202829] text-white hover:border-[#08D9C0]' : 'bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#087E73]'}`}
          >
            Select Monthly Plan
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
            <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Pay with MTN Mobile Money (MoMo)</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Selected: {selectedPlan === '5000_monthly' ? '5,000 RWF Monthly Plan' : '200 RWF Daily Plan'}</p>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Shop Phone Number</label>
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
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>MTN MoMo Reference / Pin Code</label>
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
            <span>Authorize MoMo Payment & Upgrade Instantly</span>
          </button>
        </form>
      </div>
    </div>
  );
}
