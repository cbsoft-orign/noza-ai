import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Mic, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/useApp';
import logoImg from '../assets/nozalogo_b2dda888.png';

export default function Landing() {
  const navigate = useNavigate();
  const { backendStatus } = useApp();

  return (
    <div className="min-h-screen bg-[#07090A] text-white flex flex-col justify-between selection:bg-[#08D9C0] selection:text-black">
      {/* Header */}
      <header className="px-8 py-5 border-b border-[#202829] flex items-center justify-between bg-[#050909]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NOZA Logo" className="h-10 object-contain drop-shadow-[0_0_10px_rgba(8,217,192,0.5)]" />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#101516] border border-[#202829] text-xs text-[#B4BABB]">
            <span className="w-2 h-2 rounded-full bg-[#08D9C0] animate-pulse" />
            <span>{backendStatus}</span>
          </div>
          <button
            onClick={() => navigate('/signin')}
            className="px-4 py-2 rounded-xl bg-[#101516] border border-[#202829] text-sm font-semibold text-white hover:border-[#08D9C0] transition"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black text-sm font-bold hover:opacity-95 transition shadow-lg shadow-[#08D9C0]/20 flex items-center gap-2"
          >
            <span>Create Shop</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#101516] border border-[#202829] text-xs text-[#08D9C0] mb-6">
          <ShieldCheck className="w-4 h-4" />
          <span>Built for Rwandan Dukas • WhatsApp & Voice AI Enabled</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-black tracking-tight max-w-4xl leading-tight">
          Smart Stock, Instant Profit & <span className="text-[#08D9C0]">Kinyarwanda Voice POS</span>
        </h2>
        <p className="text-lg text-[#B4BABB] max-w-2xl mt-6">
          Manage inventory, record sales by voice or WhatsApp, track worker performance, and compare village market prices instantly in RWF.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-extrabold text-base hover:opacity-95 transition shadow-xl shadow-[#08D9C0]/30 flex items-center justify-center gap-3"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Launch NOZA Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#101516] border border-[#202829] text-white font-semibold text-base hover:border-[#08D9C0] transition flex items-center justify-center gap-3"
          >
            <Mic className="w-5 h-5 text-[#08D9C0]" />
            <span>Test Voice & WhatsApp TILL</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20 text-left">
          <div className="p-6 rounded-2xl bg-[#101516] border border-[#202829]">
            <div className="w-12 h-12 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] mb-4">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Instant POS & Sales</h3>
            <p className="text-sm text-[#B4BABB] mt-2">Record sales instantly with automatic profit calculation (Inyungu) and fractional units.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#101516] border border-[#202829]">
            <div className="w-12 h-12 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Kinyarwanda Voice & WhatsApp</h3>
            <p className="text-sm text-[#B4BABB] mt-2">Send voice notes or WhatsApp texts like "Gurisha umuceri 2" and watch your stock update automatically.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#101516] border border-[#202829]">
            <div className="w-12 h-12 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">MTN MoMo Integration</h3>
            <p className="text-sm text-[#B4BABB] mt-2">Seamlessly upgrade your plan using 200 RWF daily or 5,000 RWF monthly MoMo payments.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-[#202829] text-center text-xs text-[#747E80] bg-[#050909]">
        NOZA Stock Management & TILL • Powered by React, Vite, Tailwind & Next.js Backend
      </footer>
    </div>
  );
}
