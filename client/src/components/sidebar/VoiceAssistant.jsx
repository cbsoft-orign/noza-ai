import { ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';

export default function VoiceAssistant({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, lang } = useApp();
  const t = getTranslations(lang);

  const handleClick = () => {
    onNavigate?.();
    if (location.pathname === '/pos' && location.hash === '#voice-assistant') {
      document.getElementById('voice-assistant')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      navigate('/pos#voice-assistant');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full p-3 rounded-2xl border transition text-left group shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E73] ${
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
          <p className="text-xs font-bold tracking-wide">{t.nav.voiceAssistant}</p>
          <p className={`text-[10px] ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.nav.voiceAssistantSub}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[#08D9C0] group-hover:translate-x-0.5 transition" />
    </button>
  );
}
