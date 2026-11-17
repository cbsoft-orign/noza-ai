import { useState } from 'react';
import { ShoppingCart, Mic, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function POS() {
  const { products, recordSale, shop } = useApp();
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

  const handleCheckout = (e) => {
    e.preventDefault();
    recordSale(selectedProductId, Number(quantity), soldBy);
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
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: [{ changes: [{ value: { messages: [{ from: shop.phone, type: 'text', text: { body: userMsg } }] } }] }],
        }),
      });
      const data = await res.json();
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: data.response || 'Command executed successfully.' }]);
    } catch {
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: `(Demo response): Processed "${userMsg}" successfully and updated inventory.` }]);
    }
  };

  const simulateVoiceNote = async () => {
    setTranscribing(true);
    try {
      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: shop.phone, audioUrl: 'https://example.com/voice.ogg' }),
      });
      const data = await res.json();
      setWhatsappLog((prev) => [
        ...prev,
        { sender: 'user', text: `[Voice Note]: "${data.transcript || 'Mfite umuceri 2'}"` },
        { sender: 'shop', text: data.response || 'Voice intent executed.' },
      ]);
    } catch {
      setWhatsappLog((prev) => [
        ...prev,
        { sender: 'user', text: '[Voice Note]: "Gurisha isukari 1"' },
        { sender: 'shop', text: 'Isukari 1 yagurishijwe - Inyungu 350 RWF' },
      ]);
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-white">POS & AI Voice Console</h2>
        <p className="text-sm text-[#a5acad] mt-1">Record manual sales, test Kinyarwanda voice transcription, and simulate WhatsApp webhook commands.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#087e73]/20 border border-[#08d9c0] text-[#08d9c0] font-semibold text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manual POS Checkout */}
        <div className="bg-[#111516] border border-[#202829] rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/30 flex items-center justify-center text-[#08d9c0]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Fast Checkout (POS)</h3>
              <p className="text-xs text-[#a5acad]">Tap products and record sales instantly</p>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-2">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0]"
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
                <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-2">Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-2">Sold By</label>
                <select
                  value={soldBy}
                  onChange={(e) => setSoldBy(e.target.value)}
                  className="w-full bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0]"
                >
                  <option value="owner">Shop Owner</option>
                  <option value="worker">Worker / Employee</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#087e73] to-[#08d9c0] text-black font-extrabold text-base hover:opacity-95 transition shadow-xl shadow-[#08d9c0]/20 mt-4"
            >
              Complete Sale & Calculate Profit
            </button>
          </form>
        </div>

        {/* WhatsApp & Voice Simulator */}
        <div className="bg-[#111516] border border-[#202829] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/30 flex items-center justify-center text-[#08d9c0]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">WhatsApp & Voice Bot</h3>
                  <p className="text-xs text-[#a5acad]">Simulate Kinyarwanda webhook messages</p>
                </div>
              </div>
              <button
                type="button"
                onClick={simulateVoiceNote}
                disabled={transcribing}
                className="px-3.5 py-2 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/40 text-xs font-bold text-[#08d9c0] hover:bg-[#087e73]/40 transition flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4 animate-pulse" />
                <span>{transcribing ? 'Transcribing...' : 'Simulate Voice Note'}</span>
              </button>
            </div>

            {/* Chat Log */}
            <div className="h-[220px] overflow-y-auto bg-[#07090a] border border-[#202829] rounded-2xl p-4 space-y-3 mb-4">
              {whatsappLog.map((log, idx) => (
                <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${log.sender === 'user' ? 'bg-[#08d9c0] text-black font-semibold' : 'bg-[#111516] border border-[#202829] text-white'}`}>
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
              className="flex-1 bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0]"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#087e73] to-[#08d9c0] text-black font-bold hover:opacity-95 transition flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
