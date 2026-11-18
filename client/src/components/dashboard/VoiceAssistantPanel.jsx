import { useState } from 'react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function VoiceAssistantPanel() {
  const { shop, theme } = useApp();
  const [listening, setListening] = useState(true);
  const [inputCommand, setInputCommand] = useState('');
  const [chatLog, setChatLog] = useState([
    { sender: 'ai', text: 'Muraho! Ndi Voice Assistant yawe. Vuga cyangwa andika (e.g. Gurisha umuceri 2, STOCK).' },
  ]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;

    const userText = inputCommand;
    setChatLog((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputCommand('');

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: [{ changes: [{ value: { messages: [{ from: shop.phone, type: 'text', text: { body: userText } }] } }] }],
        }),
      });
      const data = await res.json();
      setChatLog((prev) => [...prev, { sender: 'ai', text: data.response || 'Command executed successfully.' }]);
    } catch {
      setChatLog((prev) => [...prev, { sender: 'ai', text: `(Demo): Processed "${userText}" successfully.` }]);
    }
  };

  return (
    <div
      className={`border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-[#101516] border-[#08D9C0]/40' : 'bg-white border-[#087E73]/40'
      }`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#08D9C0]/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/40 flex items-center justify-center text-[#08D9C0]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Dashboard Kinyarwanda Voice & AI Console</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Interact with your shop intelligence inside the dashboard area</p>
          </div>
        </div>
        <button
          onClick={() => setListening(!listening)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            listening ? 'bg-[#08D9C0]/20 text-[#08D9C0] border border-[#08D9C0]/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {listening ? <Mic className="w-3.5 h-3.5 animate-bounce" /> : <MicOff className="w-3.5 h-3.5" />}
          <span>{listening ? 'Listening Active' : 'Paused'}</span>
        </button>
      </div>

      {/* Voice wave bars */}
      <div className={`flex items-center justify-center gap-1 h-8 mb-4 rounded-xl px-4 border ${theme === 'dark' ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
        {[30, 60, 90, 45, 75, 100, 55, 80, 40, 70, 85, 50].map((h, i) => (
          <span
            key={i}
            className="w-1 bg-[#08D9C0] rounded-full transition-all duration-300 animate-pulse"
            style={{ height: listening ? `${h}%` : '20%', animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>

      {/* Chat scroll box */}
      <div className={`h-[150px] overflow-y-auto rounded-xl p-3 space-y-2 mb-3 text-xs border ${theme === 'dark' ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
        {chatLog.map((log, idx) => (
          <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl leading-relaxed ${log.sender === 'user' ? 'bg-[#08D9C0] text-black font-semibold' : theme === 'dark' ? 'bg-[#101516] border border-[#202829] text-white' : 'bg-white border border-slate-200 text-slate-900'}`}>
              {log.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          placeholder="Type or speak command (e.g. Gurisha umuceri 1)..."
          className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#08D9C0] border ${
            theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white placeholder-[#747E80]' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
          }`}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs hover:opacity-95 transition flex items-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
