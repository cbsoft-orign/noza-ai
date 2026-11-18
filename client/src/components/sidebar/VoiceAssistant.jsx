import { ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/useApp';

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useApp();

  const handleClick = () => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 rounded-2xl border transition cursor-pointer group shadow-sm ${
        theme === 'dark'
          ? 'bg-[#101516] border-[#08D9C0]/40 hover:border-[#08D9C0] hover:bg-[#142020] text-white'
          : 'bg-white border-[#087E73]/30 hover:border-[#087E73] hover:bg-slate-50 text-slate-900'
      } flex items-center justify-between`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-end gap-0.5 h-5 w-6 py-0.5">
          <span className="w-1 bg-[#08D9C0] h-2 rounded-full animate-pulse" />
          <span className="w-1 bg-[#08D9C0] h-5 rounded-full animate-pulse delay-75" />
          <span className="w-1 bg-[#08D9C0] h-3 rounded-full animate-pulse delay-150" />
          <span className="w-1 bg-[#08D9C0] h-4 rounded-full animate-pulse delay-200" />
        </div>
        <div>
          <p className="text-xs font-bold tracking-wide">Voice Assistant</p>
          <p className={`text-[10px] ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>In Dashboard Area</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[#08D9C0] group-hover:translate-x-0.5 transition" />
    </div>
  );
}
