import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Mic, ShieldCheck, ArrowRight, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/useApp';
import logoImg from '../assets/nozalogo_b2dda888.png';

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();
  const dark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-teal-200 selection:text-teal-950 ${dark ? 'bg-[#07090A] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`px-5 md:px-8 py-4 border-b flex items-center justify-between sticky top-0 z-20 ${dark ? 'border-[#202829] bg-[#07090A]' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NOZA Logo" className="h-10 object-contain" />
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className={`p-2 rounded-lg ${dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => navigate('/signin')}
            className={`px-3 md:px-4 py-2 rounded-lg border text-sm font-semibold transition ${dark ? 'bg-[#101516] border-[#202829] text-white hover:border-[#08D9C0]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-3 md:px-4 py-2 rounded-lg bg-[#087E73] text-white text-sm font-semibold hover:bg-[#06665e] transition flex items-center gap-2"
          >
            <span>Create Shop</span>
            <ArrowRight className="w-4 h-4 hidden sm:block" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center flex flex-col items-center">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs mb-6 ${dark ? 'bg-[#101516] border-[#202829] text-[#08D9C0]' : 'bg-teal-50 border-teal-100 text-[#087E73]'}`}>
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>Built for Rwandan Dukas • WhatsApp & Voice AI Enabled</span>
        </div>
        <h2 className={`text-4xl md:text-6xl font-bold tracking-tight max-w-4xl leading-tight ${dark ? 'text-white' : 'text-slate-950'}`}>
          Smart Stock, Instant Profit & <span className={dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}>Kinyarwanda Voice POS</span>
        </h2>
        <p className={`text-lg max-w-2xl mt-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          Manage inventory, record sales by voice or WhatsApp, track worker performance, and compare village market prices instantly in RWF.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#087E73] text-white font-semibold text-base hover:bg-[#06665e] transition flex items-center justify-center gap-3"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Launch NOZA Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/pos')}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg border font-medium text-base transition flex items-center justify-center gap-3 ${dark ? 'bg-[#101516] border-[#202829] text-white hover:border-[#08D9C0]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
          >
            <Mic className={`w-5 h-5 ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`} />
            <span>Test Voice & WhatsApp TILL</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20 text-left">
          <div className={`p-6 rounded-xl border ${dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${dark ? 'bg-[#087E73]/20 text-[#08D9C0]' : 'bg-teal-50 text-[#087E73]'}`}>
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Instant POS & Sales</h3>
            <p className={`text-sm mt-2 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>Record sales instantly with automatic profit calculation (Inyungu) and fractional units.</p>
          </div>
          <div className={`p-6 rounded-xl border ${dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${dark ? 'bg-[#087E73]/20 text-[#08D9C0]' : 'bg-teal-50 text-[#087E73]'}`}>
              <Mic className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Kinyarwanda Voice & WhatsApp</h3>
            <p className={`text-sm mt-2 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>Send voice notes or WhatsApp texts like "Gurisha umuceri 2" and watch your stock update automatically.</p>
          </div>
          <div className={`p-6 rounded-xl border ${dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${dark ? 'bg-[#087E73]/20 text-[#08D9C0]' : 'bg-teal-50 text-[#087E73]'}`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>MTN MoMo Integration</h3>
            <p className={`text-sm mt-2 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>Seamlessly upgrade your plan using 200 RWF daily or 5,000 RWF monthly MoMo payments.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-8 py-6 border-t text-center text-xs ${dark ? 'border-[#202829] text-slate-400 bg-[#07090A]' : 'border-slate-200 text-slate-500 bg-white'}`}>
        NOZA Stock Management & TILL • Powered by React, Vite, Tailwind & Next.js Backend
      </footer>
    </div>
  );
}
