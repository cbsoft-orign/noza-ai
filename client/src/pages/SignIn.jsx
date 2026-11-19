import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';

export default function SignIn() {
  const navigate = useNavigate();
  const { acceptAuthentication, theme, toggleTheme } = useApp();
  const dark = theme === 'dark';
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
    <div className={`min-h-screen flex items-center justify-center p-6 selection:bg-teal-200 selection:text-teal-950 ${dark ? 'bg-[#07090a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`w-full max-w-md border rounded-2xl p-6 sm:p-8 ${dark ? 'bg-[#111516] border-[#202829]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-start justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl ${dark ? 'bg-[#087e73]/30 text-[#08d9c0]' : 'bg-teal-50 text-[#087e73]'}`}>
            N
          </div>
          <div>
            <h1 className={`font-semibold text-xl ${dark ? 'text-white' : 'text-slate-900'}`}>Sign in to NOZA</h1>
            <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Access your shop workspace</p>
          </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className={`p-2 rounded-lg ${dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          {error && <p role="alert" className={`text-sm ${dark ? 'text-red-400' : 'text-red-700'}`}>{error}</p>}
          <div>
            <label className={`block text-sm font-medium mb-2 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>Shop Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="250788000001"
                className={`w-full border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#087e73]/20 focus:border-[#087e73] ${
                  dark ? 'bg-[#07090a] border-[#202829] text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                required
              />
            </div>
            <p className={`text-xs mt-1.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Enter your Rwandan phone number (format: 2507XXXXXXXX).</p>
          </div>

          <div className={`p-4 rounded-lg border flex items-center gap-3 ${dark ? 'bg-[#0c1112] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
            <ShieldCheck className={`w-5 h-5 shrink-0 ${dark ? 'text-[#08d9c0]' : 'text-[#087e73]'}`} />
            <p className={`text-xs ${dark ? 'text-slate-300' : 'text-slate-600'}`}>Demo login: Automatically connects you to Kigali Duka with full owner privileges.</p>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#087e73] text-white font-semibold text-sm hover:bg-[#06665e] transition flex items-center justify-center gap-2"
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
            Don't have a shop yet?{' '}
            <button onClick={() => navigate('/signup')} className={`font-semibold hover:underline ${dark ? 'text-[#08d9c0]' : 'text-[#087e73]'}`}>
              Create Shop (Sign Up)
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
