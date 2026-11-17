import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function VoiceAIModal({ isOpen, onClose }) {
  const { shop } = useApp();
  const [listening, setListening] = useState(isOpen);
  const [transcript, setTranscript] = useState('Ndateka kuvuga (Speak in Kinyarwanda or English)...');
  const [aiResponse, setAiResponse] = useState('Muraho! Mfite gute? (How can I help your stock today?)');

  const recordVoiceIntent = useCallback(async () => {
    try {
      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#101516] border border-[#08D9C0]/50 rounded-3xl p-8 w-full max-w-lg shadow-[0_0_50px_rgba(8,217,192,0.25)] flex flex-col items-center text-center relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#07090A] border border-[#202829] text-[#B4BABB] hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-white mb-2">NOZA Kinyarwanda Voice Assistant</h3>
        <p className="text-xs text-[#B4BABB] mb-8">Speak naturally to manage your store stock and sales</p>

        {/* Central Glowing Orb & Gradient Waves */}
        <div className="relative w-48 h-48 flex items-center justify-center my-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#087E73] to-[#08D9C0] opacity-30 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#087E73] to-[#08D9C0] opacity-40 blur-xl animate-pulse" />
          
          <div className="relative w-36 h-36 rounded-full bg-[#050909] border-2 border-[#08D9C0] flex items-center justify-center shadow-[0_0_30px_rgba(8,217,192,0.6)]">
            <Mic className={`w-12 h-12 text-[#08D9C0] ${listening ? 'animate-bounce' : ''}`} />
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

        <div className="w-full bg-[#07090A] border border-[#202829] rounded-2xl p-4 my-4 text-left space-y-2">
          <p className="text-[11px] text-[#747E80] uppercase tracking-wider">Detected Transcript:</p>
          <p className="text-sm font-semibold text-white italic">"{transcript}"</p>
          <hr className="border-[#202829]" />
          <p className="text-[11px] text-[#08D9C0] uppercase tracking-wider">AI Response:</p>
          <p className="text-sm font-bold text-[#08D9C0]">{aiResponse}</p>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setListening(!listening)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition ${
              listening ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-[#08D9C0] text-black shadow-lg shadow-[#08D9C0]/30'
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{listening ? 'Pause Listening' : 'Resume Listening'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-[#07090A] border border-[#202829] text-white font-semibold text-sm hover:border-[#08D9C0] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
