import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { apiUrl } from '../../api';
import useBrowserKinyarwandaAsr from '../../hooks/useBrowserKinyarwandaAsr';
import { getTranslations } from '../../data/translations';

export default function VoiceAssistantPanel() {
  const { theme, refreshShopData, lang } = useApp();
  const t = getTranslations(lang);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [inputCommand, setInputCommand] = useState('');
  const {
    phase: transcriptionPhase,
    progress: modelProgress,
    error: transcriptionError,
    transcribe,
    prepare: prepareTranscriptionModel,
  } = useBrowserKinyarwandaAsr();
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const [chatLog, setChatLog] = useState([
    { sender: 'ai', isInitial: true, text: t.voice.initialMessage },
  ]);

  const runCommand = async (userText) => {
    setProcessing(true);
    setError('');
    let responseStatus = null;
    try {
      const res = await fetch(apiUrl('/api/voice/command'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: userText }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        responseStatus = res.status;
        throw new Error(data.message || t.voice.commandFailed);
      }
      setChatLog((prev) => [...prev, { sender: 'ai', text: data.response }]);
      await refreshShopData().catch((refreshError) => setError(refreshError.message || t.voice.refreshFailed));
      return { ok: true };
    } catch (requestError) {
      setError(requestError.message || t.voice.commandFailed);
      return { ok: false, status: responseStatus };
    } finally {
      setProcessing(false);
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
    setError('');
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(t.voice.micUnsupported);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      prepareTranscriptionModel();
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        setError(t.voice.micFailed);
        setRecording(false);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) {
          setError(t.voice.noAudio);
          return;
        }

        setProcessing(true);
        try {
          const transcript = await transcribe(audio);
          setChatLog((prev) => [...prev, { sender: 'user', text: transcript }]);
          await runCommand(transcript);
        } catch (requestError) {
          setError(requestError.message || t.voice.couldNotTranscribe);
        } finally {
          setProcessing(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (requestError) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError(requestError.message || t.voice.micDenied);
    }
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

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
            recording ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-[#08D9C0]/20 text-[#08D9C0] border border-[#08D9C0]/40'
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

      {(transcriptionPhase === 'loading' || transcriptionPhase === 'decoding' || transcriptionPhase === 'transcribing') && (
        <div className={`mb-3 rounded-xl border p-3 text-xs ${theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-[#B4BABB]' : 'bg-slate-50 border-slate-200 text-slate-600'}`} role="status" aria-live="polite">
          {transcriptionPhase === 'loading' ? (
            <>
              <p>{t.voice.modelDownloadProgress(modelProgress)}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-300/40" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={modelProgress}>
                <div className="h-full rounded-full bg-[#08D9C0] transition-all" style={{ width: `${modelProgress}%` }} />
              </div>
            </>
          ) : (
            <p>
              {transcriptionPhase === 'decoding'
                ? t.voice.preparingAudio
                : t.voice.transcribingInBrowser}
            </p>
          )}
        </div>
      )}
      <p className={`mb-3 text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
        {t.voice.localModelNotice}
      </p>
      {transcriptionError && <p className="mb-3 text-xs text-red-400" role="alert">{transcriptionError}</p>}

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

      {error && <p className="mb-3 text-xs text-red-400" role="alert">{error}</p>}

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
