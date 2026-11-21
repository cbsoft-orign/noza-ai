import { useState } from 'react';
import { Mic, MicOff, Send, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { apiUrl } from '../../api';
import useGroqVoiceCommand from '../../hooks/useGroqVoiceCommand';
import { getTranslations } from '../../data/translations';

export default function VoiceAssistantPanel() {
  const { theme, refreshShopData, lang, products } = useApp();
  const t = getTranslations(lang);
  const [inputCommand, setInputCommand] = useState('');
  const [panelFeedback, setPanelFeedback] = useState(null);

  const {
    recording,
    processing,
    statusText,
    error: voiceError,
    startRecording,
    stopRecording,
  } = useGroqVoiceCommand();

  const [chatLog, setChatLog] = useState([
    { sender: 'ai', isInitial: true, text: t.voice.initialMessage },
  ]);

  const showFeedback = (message, type = 'success') => {
    setPanelFeedback({ message, type });
    window.setTimeout(() => setPanelFeedback(null), 5000);
  };

  const runCommand = async (commandOrText) => {
    const payload = typeof commandOrText === 'string'
      ? { text: commandOrText }
      : { command: commandOrText };

    try {
      const res = await fetch(apiUrl('/api/voice/command'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || t.voice.commandFailed);
      }
      setChatLog((prev) => [...prev, { sender: 'ai', text: data.response }]);
      showFeedback(data.response, 'success');
      await refreshShopData().catch((refreshError) => {
        showFeedback(refreshError.message || t.voice.refreshFailed, 'error');
      });
      return { ok: true };
    } catch (requestError) {
      const msg = requestError.message || t.voice.commandFailed;
      showFeedback(msg, 'error');
      return { ok: false };
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const userText = inputCommand.trim();
    if (!userText || processing) return;
    setChatLog((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputCommand('');
    await runCommand(userText);
  };

  const handleRecording = async () => {
    if (recording) {
      try {
        const result = await stopRecording(products);
        if (result && result.corrected_text) {
          setChatLog((prev) => [...prev, { sender: 'user', text: result.corrected_text }]);
          await runCommand(result);
        }
      } catch (err) {
        showFeedback(err.message || t.voice.couldNotTranscribe, 'error');
      }
    } else {
      try {
        await startRecording();
      } catch (err) {
        showFeedback(err.message || t.voice.micDenied, 'error');
      }
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
            <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.voice.panelTitle}</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.voice.panelSubtitle}</p>
          </div>
        </div>
        <button
          onClick={handleRecording}
          disabled={processing}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            recording
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
              : 'bg-[#08D9C0]/20 text-[#08D9C0] border border-[#08D9C0]/40 hover:bg-[#08D9C0]/30'
          }`}
        >
          {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>{processing ? t.common.processing : recording ? t.common.stopRecording : t.voice.speak}</span>
        </button>
      </div>

      {/* Voice wave bars */}
      <div className={`flex items-center justify-center gap-1 h-8 mb-4 rounded-xl px-4 border ${theme === 'dark' ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
        {[30, 60, 90, 45, 75, 100, 55, 80, 40, 70, 85, 50].map((h, i) => (
          <span
            key={i}
            className="w-1 bg-[#08D9C0] rounded-full transition-all duration-300 animate-pulse"
            style={{ height: recording ? `${h}%` : '20%', animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>

      {/* Fast Processing Indicator (~1-2s) */}
      {processing && (
        <div
          className={`mb-3 rounded-xl border p-3 text-xs flex items-center gap-2.5 animate-pulse ${
            theme === 'dark' ? 'bg-[#07090A] border-[#08D9C0]/40 text-[#08D9C0]' : 'bg-teal-50 border-teal-300 text-teal-900'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="w-3.5 h-3.5 border-2 border-[#08D9C0] border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold">{statusText || t.voice.processingCommand}</p>
        </div>
      )}

      {/* Zero MB Download Banner */}
      <p className={`mb-3 text-[11px] font-medium flex items-center gap-1.5 ${theme === 'dark' ? 'text-[#08D9C0]' : 'text-teal-700'}`}>
        <Sparkles className="w-3.5 h-3.5" />
        <span>0 MB download · Groq Whisper & Llama 3.3 Cloud Processing</span>
      </p>

      {voiceError && <p className="mb-3 text-xs text-red-400" role="alert">{voiceError}</p>}

      {panelFeedback && (
        <div className={`mb-3 rounded-xl border p-2.5 text-xs font-semibold flex items-center gap-2 ${
          panelFeedback.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-teal-500/10 border-teal-500/30 text-[#08D9C0]'
        }`}>
          {panelFeedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{panelFeedback.message}</span>
        </div>
      )}

      <div className={`mb-3 rounded-xl border p-3 text-xs leading-relaxed ${theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-[#B4BABB]' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        <p className={`mb-1 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.voice.tipsTitle}</p>
        <p>{t.voice.tipSell} <strong>{t.voice.tipSellEx}</strong> · {t.voice.tipRestock} <strong>{t.voice.tipRestockEx}</strong></p>
        <p>{t.voice.tipStock} <strong>{t.voice.tipStockEx}</strong> · {t.voice.tipReport} <strong>{t.voice.tipReportEx}</strong></p>
        <p className="mt-1">{t.voice.tipsNote}</p>
      </div>

      {/* Chat scroll box */}
      <div className={`h-[150px] overflow-y-auto rounded-xl p-3 space-y-2 mb-3 text-xs border ${theme === 'dark' ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
        {chatLog.map((log, idx) => (
          <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl leading-relaxed ${log.sender === 'user' ? 'bg-[#08D9C0] text-black font-semibold' : theme === 'dark' ? 'bg-[#101516] border border-[#202829] text-white' : 'bg-white border border-slate-200 text-slate-900'}`}>
              {log.isInitial ? t.voice.initialMessage : log.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          disabled={processing}
          placeholder={t.voice.inputPlaceholder}
          className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#08D9C0] border ${
            theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white placeholder-[#747E80]' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
          }`}
        />
        <button
          type="submit"
          disabled={processing}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs hover:opacity-95 transition flex items-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t.common.send}</span>
        </button>
      </form>
    </div>
  );
}
