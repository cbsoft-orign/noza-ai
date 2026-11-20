import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { apiUrl } from '../../api';
import { getTranslations } from '../../data/translations';

export default function VoiceAIModal({ isOpen, onClose }) {
  const { shop, theme, lang } = useApp();
  const dark = theme === 'dark';
  const t = getTranslations(lang);
  const [listening, setListening] = useState(isOpen);
  const [transcript, setTranscript] = useState(() => t.voice.initialTranscript);
  const [aiResponse, setAiResponse] = useState(() => t.voice.initialAiResponse);

  const recordVoiceIntent = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/voice/transcribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: shop.phone, audioUrl: 'https://example.com/voice.ogg' }),
      });
      const data = await res.json();
      if (data.response) {
        setAiResponse(data.response);
      }
    } catch {
      // fallback handled
    }
  }, [shop.phone]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setTranscript('Gurisha umuceri 2');
        setAiResponse('Umuceri 2 wagurishijwe - Inyungu 600 RWF');
        recordVoiceIntent();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, recordVoiceIntent]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn ${dark ? 'bg-black/85 backdrop-blur-md' : 'bg-slate-900/30 backdrop-blur-sm'}`}>
      <div className={`border rounded-2xl p-6 sm:p-8 w-full max-w-lg flex flex-col items-center text-center relative ${dark ? 'bg-[#101516] border-[#08D9C0]/50 shadow-[0_0_50px_rgba(8,217,192,0.25)]' : 'bg-white border-slate-200 shadow-xl'}`}>
        <button
          onClick={onClose}
          aria-label={t.voice.closeModalAria}
          className={`absolute top-4 right-4 p-2 rounded-lg transition ${dark ? 'bg-[#07090A] border border-[#202829] text-slate-400 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className={`text-xl font-semibold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{t.voice.modalTitle}</h3>
        <p className={`text-sm mb-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{t.voice.modalSubtitle}</p>

        {/* Central Glowing Orb & Gradient Waves */}
        <div className="relative w-48 h-48 flex items-center justify-center my-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#087E73] to-[#08D9C0] opacity-30 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#087E73] to-[#08D9C0] opacity-40 blur-xl animate-pulse" />
          
          <div className={`relative w-36 h-36 rounded-full border-2 flex items-center justify-center ${dark ? 'bg-[#050909] border-[#08D9C0] shadow-[0_0_30px_rgba(8,217,192,0.6)]' : 'bg-teal-50 border-teal-200'}`}>
            <Mic className={`w-12 h-12 ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'} ${listening ? 'animate-bounce' : ''}`} />
          </div>
        </div>

        {/* Voice Wave Animation Bars */}
        <div className="flex items-center justify-center gap-1.5 h-10 my-4 w-full">
          {[40, 70, 95, 60, 85, 100, 50, 75, 90, 45, 65, 80].map((h, i) => (
            <span
              key={i}
              className="w-1.5 bg-gradient-to-t from-[#087E73] to-[#08D9C0] rounded-full transition-all duration-300 animate-pulse"
              style={{ height: listening ? `${h}%` : '20%', animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

        <div className={`w-full border rounded-xl p-4 my-4 text-left space-y-2 ${dark ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
          <p className={`text-[11px] uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t.voice.detectedTranscript}</p>
          <p className={`text-sm font-semibold italic ${dark ? 'text-white' : 'text-slate-900'}`}>"{transcript}"</p>
          <hr className={dark ? 'border-[#202829]' : 'border-slate-200'} />
          <p className={`text-[11px] uppercase tracking-wider ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`}>{t.voice.aiResponse}</p>
          <p className={`text-sm font-semibold ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`}>{aiResponse}</p>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setListening(!listening)}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
              listening ? 'bg-amber-500/10 border border-amber-500/40 text-amber-700' : dark ? 'bg-[#08D9C0] text-black' : 'bg-[#087E73] text-white'
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{listening ? t.voice.pauseListening : t.voice.resumeListening}</span>
          </button>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-lg border font-medium text-sm transition ${dark ? 'bg-[#07090A] border-[#202829] text-white hover:border-[#08D9C0]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            {t.common.done}
          </button>
        </div>
      </div>
    </div>
  );
}
