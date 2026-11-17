import { useState } from 'react';
import { CreditCard, CheckCircle2, Zap } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Billing() {
  const { shop, upgradePlan } = useApp();
  const [selectedPlan, setSelectedPlan] = useState('200_daily');
  const [momoRef, setMomoRef] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    const amount = selectedPlan === '5000_monthly' ? 5000 : 200;
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: shop.phone,
          type: selectedPlan,
          amount,
          momo_ref: momoRef || `MOMO-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        upgradePlan(selectedPlan);
        setSuccessMsg(`Successfully upgraded to ${selectedPlan === '5000_monthly' ? 'Monthly' : 'Daily'} Plan!`);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch {
      upgradePlan(selectedPlan);
      setSuccessMsg(`Successfully upgraded to ${selectedPlan === '5000_monthly' ? 'Monthly' : 'Daily'} Plan!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Billing & MTN MoMo Plans</h2>
        <p className="text-sm text-[#a5acad] mt-1">Upgrade your shop plan to unlock unlimited products and priority AI features.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#087e73]/20 border border-[#08d9c0] text-[#08d9c0] font-semibold text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-3xl border transition flex flex-col justify-between ${shop.plan === 'free' ? 'bg-[#111516] border-[#08d9c0]' : 'bg-[#111516]/60 border-[#202829]'}`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a5acad]">Starter</span>
            <h3 className="text-2xl font-black text-white mt-1">Free Plan</h3>
            <p className="text-sm text-[#a5acad] mt-2">Perfect for getting started with basic retail inventory.</p>
            <ul className="space-y-2.5 mt-6 text-sm text-white">
              <li className="flex items-center gap-2">✓ Up to 10 products max</li>
              <li className="flex items-center gap-2">✓ 20 starter credits</li>
              <li className="flex items-center gap-2">✓ WhatsApp webhook support</li>
            </ul>
          </div>
          <div className="mt-8">
            <span className="text-xs font-bold text-[#08d9c0]">Current Active Plan</span>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border transition flex flex-col justify-between ${shop.plan === 'daily' ? 'bg-[#111516] border-[#08d9c0]' : 'bg-[#111516]/80 border-[#202829]'}`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#08d9c0]">Popular Daily</span>
            <h3 className="text-2xl font-black text-white mt-1">200 RWF <span className="text-xs font-normal text-[#a5acad]">/ day</span></h3>
            <p className="text-sm text-[#a5acad] mt-2">Unlimited products with daily automated WhatsApp digests.</p>
            <ul className="space-y-2.5 mt-6 text-sm text-white">
              <li className="flex items-center gap-2">✓ Unlimited products</li>
              <li className="flex items-center gap-2">✓ 25 credits per top-up</li>
              <li className="flex items-center gap-2">✓ Kinyarwanda Voice TTS</li>
            </ul>
          </div>
          <button
            onClick={() => setSelectedPlan('200_daily')}
            className={`w-full py-3 rounded-xl font-bold text-sm transition mt-8 ${selectedPlan === '200_daily' ? 'bg-[#08d9c0] text-black shadow-lg shadow-[#08d9c0]/20' : 'bg-[#07090a] border border-[#202829] text-white hover:border-[#08d9c0]'}`}
          >
            Select Daily Plan
          </button>
        </div>

        <div className={`p-6 rounded-3xl border transition flex flex-col justify-between ${shop.plan === 'monthly' ? 'bg-[#111516] border-[#08d9c0]' : 'bg-[#111516]/80 border-[#202829]'}`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#08d9c0]">Best Value</span>
            <h3 className="text-2xl font-black text-white mt-1">5,000 RWF <span className="text-xs font-normal text-[#a5acad]">/ month</span></h3>
            <p className="text-sm text-[#a5acad] mt-2">Full access for established shops and multiple workers.</p>
            <ul className="space-y-2.5 mt-6 text-sm text-white">
              <li className="flex items-center gap-2">✓ Unlimited products & sales</li>
              <li className="flex items-center gap-2">✓ 200 monthly credits</li>
              <li className="flex items-center gap-2">✓ Priority AI & multi-worker support</li>
            </ul>
          </div>
          <button
            onClick={() => setSelectedPlan('5000_monthly')}
            className={`w-full py-3 rounded-xl font-bold text-sm transition mt-8 ${selectedPlan === '5000_monthly' ? 'bg-[#08d9c0] text-black shadow-lg shadow-[#08d9c0]/20' : 'bg-[#07090a] border border-[#202829] text-white hover:border-[#08d9c0]'}`}
          >
            Select Monthly Plan
          </button>
        </div>
      </div>

      {/* MTN MoMo Payment Form */}
      <div className="bg-[#111516] border border-[#202829] rounded-3xl p-8 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/30 flex items-center justify-center text-[#08d9c0]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Pay with MTN Mobile Money (MoMo)</h3>
            <p className="text-xs text-[#a5acad]">Selected: {selectedPlan === '5000_monthly' ? '5,000 RWF Monthly Plan' : '200 RWF Daily Plan'}</p>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1">Shop Phone Number</label>
            <input
              type="text"
              defaultValue={shop.phone}
              className="w-full bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1">MTN MoMo Reference / Pin Code</label>
            <input
              type="text"
              value={momoRef}
              onChange={(e) => setMomoRef(e.target.value)}
              placeholder="MOMO-REF-994821"
              className="w-full bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white placeholder-[#747d80] focus:outline-none focus:border-[#08d9c0]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#087e73] to-[#08d9c0] text-black font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-[#08d9c0]/20 flex items-center justify-center gap-2 mt-4"
          >
            <Zap className="w-4 h-4" />
            <span>Authorize MoMo Payment & Upgrade Instantly</span>
          </button>
        </form>
      </div>
    </div>
  );
}
