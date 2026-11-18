import { useEffect, useRef, useState } from 'react';
import { ShoppingCart, Mic, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';

export default function POS() {
  const { products, recordSale, theme, refreshShopData } = useApp();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 1);
  const [quantity, setQuantity] = useState(1);
  const [soldBy, setSoldBy] = useState('owner');
  const [successMsg, setSuccessMsg] = useState('');

  // Voice & WhatsApp simulator state
  const [whatsappText, setWhatsappText] = useState('Gurisha umuceri 2');
  const [whatsappLog, setWhatsappLog] = useState([
    { sender: 'shop', text: 'Muraho! Send a text or voice command (e.g. STOCK, Gurisha umuceri 2, Mfite isukari 5)' },
  ]);
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    const recorded = await recordSale(selectedProductId, Number(quantity), soldBy);
    if (!recorded) return;
    const prod = products.find((p) => p.id === Number(selectedProductId));
    setSuccessMsg(`Successfully sold ${quantity} ${prod?.unit || 'unit'} of ${prod?.name || 'product'}! Profit added.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleWhatsAppSend = async (e) => {
    e.preventDefault();
    if (!whatsappText.trim()) return;

    const userMsg = whatsappText;
    setWhatsappLog((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setWhatsappText('');

    try {
      const res = await fetch(apiUrl('/api/voice/command'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: userMsg }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Command failed.');
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: data.response }]);
    } catch (error) {
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: error.message || 'Could not process command.' }]);
    }
  };

  const handleVoiceCommand = async () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: 'Microphone recording is not supported in this browser.' }]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        setRecording(false);
        const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) return;
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append('audio', audio, 'recording.webm');
          const transcriptResponse = await fetch(apiUrl('/api/voice/transcribe'), {
            method: 'POST',
            credentials: 'include',
            body: form,
          });
          const transcriptData = await transcriptResponse.json();
          if (!transcriptResponse.ok || !transcriptData.ok) {
            throw new Error(transcriptData.message || 'Transcription failed.');
          }
          setWhatsappLog((prev) => [...prev, { sender: 'user', text: transcriptData.transcript }]);
          const commandResponse = await fetch(apiUrl('/api/voice/command'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ text: transcriptData.transcript }),
          });
          const commandData = await commandResponse.json();
          if (!commandResponse.ok || !commandData.ok) throw new Error(commandData.message || 'Voice command failed.');
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text: commandData.response }]);
          await refreshShopData().catch((refreshError) => {
            setWhatsappLog((prev) => [...prev, { sender: 'shop', text: refreshError.message || 'Could not refresh shop data.' }]);
          });
        } catch (error) {
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text: error.message || 'Voice command failed.' }]);
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (error) {
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: error.message || 'Could not access the microphone.' }]);
    }
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>POS & AI Voice Console</h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Record manual sales, test Kinyarwanda voice transcription, and simulate WhatsApp webhook commands.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0] text-[#08D9C0] font-semibold text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manual POS Checkout */}
        <div className={`border rounded-3xl p-6 flex flex-col justify-between shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Fast Checkout (POS)</h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Tap products and record sales instantly</p>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                  theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — RWF {p.selling_price.toLocaleString()} ({p.quantity} {p.unit} left)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                    theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Sold By</label>
                <select
                  value={soldBy}
                  onChange={(e) => setSoldBy(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                    theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="owner">Shop Owner</option>
                  <option value="worker">Worker / Employee</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-extrabold text-base hover:opacity-95 transition shadow-xl shadow-[#08D9C0]/20 mt-4"
            >
              Complete Sale & Calculate Profit
            </button>
          </form>
        </div>

        {/* WhatsApp & Voice Simulator */}
        <div className={`border rounded-3xl p-6 flex flex-col justify-between shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>WhatsApp & Voice Bot</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Simulate Kinyarwanda webhook messages</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleVoiceCommand}
                disabled={transcribing}
                className="px-3.5 py-2 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/40 text-xs font-bold text-[#08D9C0] hover:bg-[#087E73]/40 transition flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4 animate-pulse" />
                <span>{transcribing ? 'Processing...' : recording ? 'Stop Recording' : 'Speak Command'}</span>
              </button>
            </div>

            {/* Chat Log */}
            <div className={`h-[220px] overflow-y-auto rounded-2xl p-4 space-y-3 mb-4 border ${theme === 'dark' ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
              {whatsappLog.map((log, idx) => (
                <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${log.sender === 'user' ? 'bg-[#08D9C0] text-black font-semibold' : theme === 'dark' ? 'bg-[#101516] border border-[#202829] text-white' : 'bg-white border border-slate-200 text-slate-900'}`}>
                    {log.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleWhatsAppSend} className="flex gap-2">
            <input
              type="text"
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              placeholder="Type message (e.g. STOCK, Gurisha umuceri 2)..."
              className={`flex-1 rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white placeholder-[#747E80]' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold hover:opacity-95 transition flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
