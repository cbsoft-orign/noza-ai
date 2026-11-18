import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';

export default function SignIn() {
  const navigate = useNavigate();
  const { acceptAuthentication } = useApp();
  const [phone, setPhone] = useState('');

  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || 'Shop not found.');
        return;
      }
      acceptAuthentication(data.shop, data.user ?? { id: '', name: '', role: 'owner', phone });
      navigate('/dashboard');
    } catch {
      setError('Backend unavailable.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090a] text-white flex items-center justify-center p-6 selection:bg-[#08d9c0] selection:text-black">
      <div className="w-full max-w-md bg-[#111516] border border-[#202829] rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#087e73] to-[#08d9c0] flex items-center justify-center font-black text-black text-xl">
            N
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-wider text-white">NOZA SIGN IN</h1>
            <p className="text-xs text-[#08d9c0]">Access your shop workspace</p>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-2">Shop Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747d80]" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="250788000001"
                className="w-full bg-[#07090a] border border-[#202829] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#747d80] focus:outline-none focus:border-[#08d9c0] transition"
                required
              />
            </div>
            <p className="text-[11px] text-[#747d80] mt-1.5">Enter your Rwandan phone number (format: 2507XXXXXXXX).</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1112] border border-[#202829] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#08d9c0] shrink-0" />
            <p className="text-xs text-[#a5acad]">Demo login: Automatically connects you to Kigali Duka with full owner privileges.</p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#087e73] to-[#08d9c0] text-black font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-[#08d9c0]/20 flex items-center justify-center gap-2"
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#a5acad]">
            Don't have a shop yet?{' '}
            <button onClick={() => navigate('/signup')} className="text-[#08d9c0] font-semibold hover:underline">
              Create Shop (Sign Up)
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
