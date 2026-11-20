import { useEffect, useRef, useState } from 'react';
import { ShoppingCart, Mic, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import useBrowserWhisper from '../hooks/useBrowserWhisper';
import { discreteProductUnits, formatUnitAmount, formatUnitLabel } from '../data/productUnits';
import { getTranslations } from '../data/translations';

export default function POS() {
  const { products, recordSale, theme, refreshShopData, lang } = useApp();
  const t = getTranslations(lang);
  const location = useLocation();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [soldBy, setSoldBy] = useState('owner');
  const [successMsg, setSuccessMsg] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  // Voice & WhatsApp simulator state
  const [whatsappText, setWhatsappText] = useState('Gurisha umuceri ibiro bibiri');
  const [whatsappLog, setWhatsappLog] = useState([
    { sender: 'shop', isInitial: true, text: t.pos.initialBotMsg },
  ]);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [recording, setRecording] = useState(false);
  const {
    phase: transcriptionPhase,
    progress: modelProgress,
    error: transcriptionError,
    transcribe,
    recognizeOnline,
  } = useBrowserWhisper();
  const recorderRef = useRef(null);
  const onlineRecognitionRef = useRef(null);
  const voiceAssistantRef = useRef(null);
  const selectedProduct = products.find((product) => String(product.id) === String(selectedProductId));
  const quantityIsDiscrete = selectedProduct ? discreteProductUnits.has(selectedProduct.unit) : false;
  const saleTotal = Number(quantity) * Number(selectedProduct?.selling_price || 0);

  useEffect(() => {
    if (location.hash !== '#voice-assistant') return;
    const frameId = window.requestAnimationFrame(() => {
      voiceAssistantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash]);

  useEffect(() => {
    if (!products.length) {
      setSelectedProductId('');
      return;
    }
    setSelectedProductId((current) => (
      products.some((product) => String(product.id) === String(current))
        ? String(current)
        : String(products[0].id)
    ));
  }, [products]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    const product = products.find((item) => String(item.id) === String(selectedProductId));
    if (!product) {
      setCheckoutError(t.pos.selectProductErr);
      return;
    }
    const saleQuantity = Number(quantity);
    if (!Number.isFinite(saleQuantity) || saleQuantity <= 0) {
      setCheckoutError(t.pos.quantityPositiveErr);
      return;
    }
    setCheckoutError('');
    const recorded = await recordSale(product.id, saleQuantity, soldBy);
    if (!recorded) return;
    setSuccessMsg(
      t.pos.saleSuccess(
        formatUnitAmount(saleQuantity, product.unit || 'piece', lang),
        product.name || 'product',
      ),
    );
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
      if (!res.ok || !data.ok) throw new Error(data.message || t.voice.commandFailed);
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: data.response }]);
      if (['SELL', 'ADD_STOCK', 'CREATE_PRODUCT', 'UPDATE_PRICES'].includes(data.intent)) {
        await refreshShopData().catch((refreshError) => {
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text: refreshError.message || t.voice.refreshFailed }]);
        });
      }
    } catch (error) {
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: error.message || t.voice.commandFailed }]);
    }
  };

  const handleVoiceCommand = async () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      onlineRecognitionRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: t.voice.micUnsupported }]);
      return;
    }

    let onlineResultReady = false;
    onlineRecognitionRef.current = recognizeOnline(() => {
      onlineResultReady = true;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    }, products.map((product) => product.name));

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        const onlineRecognition = onlineRecognitionRef.current;
        onlineRecognitionRef.current = null;
        setRecording(false);
        const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) return;
        setProcessingVoice(true);
        try {
          const onlineTranscript = onlineRecognition ? await onlineRecognition.result : '';
          let transcript = onlineTranscript
            || await transcribe(audio, 'rw', products.map((product) => product.name));
          setWhatsappLog((prev) => [...prev, { sender: 'user', text: transcript }]);
          const sendVoiceCommand = async (text) => {
            const response = await fetch(apiUrl('/api/voice/command'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ text, mode: 'sell' }),
            });
            return { response, data: await response.json() };
          };
          let commandResult = await sendVoiceCommand(transcript);
          if (onlineTranscript && commandResult.response.status === 422) {
            transcript = await transcribe(audio, 'rw', products.map((product) => product.name));
            setWhatsappLog((prev) => [...prev, { sender: 'user', text: transcript }]);
            commandResult = await sendVoiceCommand(transcript);
          }
          const { response: commandResponse, data: commandData } = commandResult;
          if (!commandResponse.ok || !commandData.ok) throw new Error(commandData.message || t.voice.commandFailed);
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text: commandData.response }]);
          await refreshShopData().catch((refreshError) => {
            setWhatsappLog((prev) => [...prev, { sender: 'shop', text: refreshError.message || t.voice.refreshFailed }]);
          });
        } catch (error) {
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text: error.message || t.voice.commandFailed }]);
        } finally {
          setProcessingVoice(false);
        }
      };
      recorder.start();
      setRecording(true);
      if (onlineResultReady) recorder.stop();
    } catch (error) {
      onlineRecognitionRef.current?.stop();
      onlineRecognitionRef.current = null;
      stream?.getTracks().forEach((track) => track.stop());
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: error.message || t.voice.micDenied }]);
    }
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    onlineRecognitionRef.current?.stop();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.pos.title}</h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.pos.subtitle}</p>
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
              <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.pos.fastCheckout}</h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.pos.fastCheckoutSub}</p>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.pos.selectProduct}</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                  theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {products.length > 0 ? (
                  products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} — RWF {Number(p.selling_price).toLocaleString()} / {formatUnitLabel(p.unit, lang)} · {formatUnitAmount(p.quantity, p.unit, lang)} {t.pos.inStockSuffix}
                    </option>
                  ))
                ) : (
                  <option value="">{t.pos.noProductsAvailable}</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                  {t.pos.quantityToSell} {selectedProduct ? `(${formatUnitLabel(selectedProduct.unit, lang)})` : ''}
                </label>
                <input
                  type="number"
                  step={quantityIsDiscrete ? '1' : '0.01'}
                  min={quantityIsDiscrete ? '1' : '0.01'}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                    theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
                {selectedProduct && (
                  <p className={`mt-1.5 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatUnitAmount(selectedProduct.quantity, selectedProduct.unit, lang)} {t.pos.availableSuffix} · RWF {Number(selectedProduct.selling_price).toLocaleString()} {t.pos.perWord} {formatUnitLabel(selectedProduct.unit, lang)}
                  </p>
                )}
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>{t.pos.soldBy}</label>
                <select
                  value={soldBy}
                  onChange={(e) => setSoldBy(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                    theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="owner">{t.common.owner}</option>
                  <option value="worker">{t.common.worker}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedProduct || Number(selectedProduct.quantity) <= 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-extrabold text-base hover:opacity-95 transition shadow-xl shadow-[#08D9C0]/20 mt-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedProduct && Number(selectedProduct.quantity) > 0
                ? `${t.pos.completeSale} · RWF ${Number.isFinite(saleTotal) ? saleTotal.toLocaleString() : '0'}`
                : t.pos.noStockAvailable}
            </button>
            {checkoutError && <p className="text-sm text-red-500" role="alert">{checkoutError}</p>}
          </form>
        </div>

        {/* WhatsApp & Voice Simulator */}
        <div
          id="voice-assistant"
          ref={voiceAssistantRef}
          className={`border rounded-3xl p-6 flex flex-col justify-between shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.pos.whatsappBotTitle}</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{t.pos.whatsappBotSub}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleVoiceCommand}
                disabled={processingVoice}
                className="px-3.5 py-2 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/40 text-xs font-bold text-[#08D9C0] hover:bg-[#087E73]/40 transition flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4 animate-pulse" />
                <span>{processingVoice ? t.common.processing : recording ? t.common.stopRecording : t.pos.speakCommand}</span>
              </button>
            </div>

            {(transcriptionPhase === 'loading' || transcriptionPhase === 'decoding' || transcriptionPhase === 'transcribing' || transcriptionPhase === 'online') && (
              <div className={`mb-4 rounded-xl border p-3 text-xs ${theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-[#B4BABB]' : 'bg-slate-50 border-slate-200 text-slate-600'}`} role="status" aria-live="polite">
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
                      : transcriptionPhase === 'online'
                        ? t.voice.onlineTranscribing
                        : t.voice.transcribingInBrowser}
                  </p>
                )}
              </div>
            )}
            {transcriptionError && <p className="mb-4 text-xs text-red-500" role="alert">{transcriptionError}</p>}

            {/* Chat Log */}
            <div className={`h-[220px] overflow-y-auto rounded-2xl p-4 space-y-3 mb-4 border ${theme === 'dark' ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
              {whatsappLog.map((log, idx) => (
                <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${log.sender === 'user' ? 'bg-[#08D9C0] text-black font-semibold' : theme === 'dark' ? 'bg-[#101516] border border-[#202829] text-white' : 'bg-white border border-slate-200 text-slate-900'}`}>
                    {log.isInitial ? t.pos.initialBotMsg : log.text}
                  </div>
                </div>
              ))}
            </div>
            <div className={`mb-4 rounded-xl border p-3 text-xs leading-relaxed ${theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-[#B4BABB]' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <p className={`mb-1 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.pos.examplesTitle}</p>
              <p><strong>{t.pos.example1}</strong> · <strong>{t.pos.example2}</strong></p>
              <p><strong>{t.pos.example3}</strong></p>
              <p><strong>{t.pos.example4}</strong> · <strong>{t.pos.example5}</strong></p>
              <p><strong>{t.pos.example6}</strong> · <strong>{t.pos.example7}</strong></p>
              <p className="mt-1">{t.pos.examplesNote}</p>
            </div>
          </div>

          <form onSubmit={handleWhatsAppSend} className="flex gap-2">
            <input
              type="text"
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              placeholder={t.pos.commandPlaceholder}
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
