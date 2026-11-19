import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { apiUrl } from '../../api';

export default function VoiceAssistantPanel() {
  const { theme, refreshShopData } = useApp();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [inputCommand, setInputCommand] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const [chatLog, setChatLog] = useState([
    { sender: 'ai', text: 'Muraho! Ndi Voice Assistant yawe. Vuga itegeko rimwe cyangwa wandike mu gasanduku kari hasi.' },
  ]);

  const runCommand = async (userText) => {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/voice/command'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: userText }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Could not process command.');
      setChatLog((prev) => [...prev, { sender: 'ai', text: data.response }]);
      await refreshShopData().catch((refreshError) => setError(refreshError.message || 'Could not refresh shop data.'));
    } catch (requestError) {
      setError(requestError.message || 'Could not process command.');
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
      setError('This browser does not support microphone recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        setError('Microphone recording failed.');
        setRecording(false);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) {
          setError('No audio was recorded. Try again.');
          return;
        }

        setProcessing(true);
        const formData = new FormData();
        formData.append('audio', audio, 'recording.webm');
        formData.append('language', 'rw');
        try {
          const response = await fetch(apiUrl('/api/voice/transcribe'), {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });
          const data = await response.json();
          if (!response.ok || !data.ok) throw new Error(data.message || 'Transcription failed.');
          setChatLog((prev) => [...prev, { sender: 'user', text: data.transcript }]);
          await runCommand(data.transcript);
        } catch (requestError) {
          setError(requestError.message || 'Could not transcribe audio.');
        } finally {
          setProcessing(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (requestError) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError(requestError.message || 'Microphone access was denied.');
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
            <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Dashboard Kinyarwanda Voice & AI Console</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Interact with your shop intelligence inside the dashboard area</p>
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
          <span>{processing ? 'Processing...' : recording ? 'Stop Recording' : 'Speak'}</span>
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

      <div className={`mb-3 rounded-xl border p-3 text-xs leading-relaxed ${theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-[#B4BABB]' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        <p className={`mb-1 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Amabwiriza y’ijwi (Voice tips)</p>
        <p>Gurisha: <strong>“Gurisha umuceri ibiro bibiri”</strong> · Ongeraho stock: <strong>“Ongeraho isukari eshanu”</strong></p>
        <p>Reba stock: <strong>“Reba ububiko”</strong> · Raporo: <strong>“Raporo y’uyu munsi”</strong></p>
        <p className="mt-1">Vuga itegeko rimwe gahoro kandi mu ituze; koresha izina ry’igicuruzwa nk’uko ryanditse muri stock. Niba transcript itari yo, andika itegeko rikwiye mu gasanduku kari hasi.</p>
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

      {error && <p className="mb-3 text-xs text-red-400" role="alert">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          disabled={processing}
          placeholder="Type or speak command (e.g. Gurisha umuceri ibiro bibiri)..."
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
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
