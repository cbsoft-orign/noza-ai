import { useEffect, useRef, useState } from 'react';
import { ShoppingCart, Mic, MicOff, MessageSquare, Send, CheckCircle2, AlertCircle, Sparkles, Check, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import useGroqVoiceCommand from '../hooks/useGroqVoiceCommand';
import { discreteProductUnits, formatUnitAmount, formatUnitLabel } from '../data/productUnits';
import { getTranslations } from '../data/translations';

function normalizeName(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export default function POS() {
  const { products, recordSale, addStock, theme, refreshShopData, lang } = useApp();
  const t = getTranslations(lang);
  const location = useLocation();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [soldBy, setSoldBy] = useState('owner');
  const [successMsg, setSuccessMsg] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Voice & WhatsApp simulator state
  const [whatsappText, setWhatsappText] = useState('Gurisha umuceri ibiro bibiri');
  const [whatsappLog, setWhatsappLog] = useState([
    { sender: 'shop', isInitial: true, text: t.pos.initialBotMsg },
  ]);

  const {
    recording,
    processing: processingVoice,
    statusText: voiceStatusText,
    error: voiceError,
    startRecording,
    stopRecording,
  } = useGroqVoiceCommand();

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

  const showToast = (message, type = 'success') => {
    setFeedbackToast({ message, type });
    window.setTimeout(() => setFeedbackToast(null), 5000);
  };

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

  // Route structured JSON command from /api/transcribe to app action handlers
  const routeVoiceCommand = async (command) => {
    const { action, item, quantity: cmdQty, unit: cmdUnit, amount_rwf, customer_name, corrected_text } = command;

    // Display the returned corrected_text in chat log
    setWhatsappLog((prev) => [...prev, { sender: 'user', text: corrected_text }]);

    // Find matched product in shop inventory
    const matchedProduct = item
      ? products.find((p) => {
          const pName = normalizeName(p.name);
          const iName = normalizeName(item);
          return pName === iName || pName.includes(iName) || iName.includes(pName);
        })
      : null;

    if (action === 'SELL') {
      if (matchedProduct) {
        setSelectedProductId(String(matchedProduct.id));
        if (cmdQty && cmdQty > 0) setQuantity(cmdQty);

        const qtyToSell = cmdQty && cmdQty > 0 ? cmdQty : 1;
        const totalAmount = Number(matchedProduct.selling_price) * qtyToSell;

        // Present confirmation step
        setPendingConfirmation({
          action: 'SELL',
          title: lang === 'rw' ? 'Emeza Kugurisha' : 'Confirm Sale',
          description: lang === 'rw'
            ? `Kugurisha: ${qtyToSell} ${formatUnitLabel(cmdUnit || matchedProduct.unit, lang)} bya ${matchedProduct.name} (RWF ${totalAmount.toLocaleString()})`
            : `Sell: ${qtyToSell} ${formatUnitLabel(cmdUnit || matchedProduct.unit, lang)} of ${matchedProduct.name} (RWF ${totalAmount.toLocaleString()})`,
          onConfirm: async () => {
            setPendingConfirmation(null);
            try {
              // Dispatch to backend command handler
              const res = await fetch(apiUrl('/api/voice/command'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ command }),
              });
              const data = await res.json();
              if (res.ok && data.ok) {
                setWhatsappLog((prev) => [...prev, { sender: 'shop', text: data.response }]);
                showToast(data.response, 'success');
              } else {
                // Fallback to local recordSale handler
                const ok = await recordSale(matchedProduct.id, qtyToSell, soldBy);
                if (ok) {
                  showToast(lang === 'rw' ? 'Byagurishijwe neza!' : 'Sale recorded successfully!', 'success');
                  setWhatsappLog((prev) => [
                    ...prev,
                    { sender: 'shop', text: `Byagurishijwe: ${qtyToSell} ${matchedProduct.unit} bya ${matchedProduct.name}.` },
                  ]);
                }
              }
              await refreshShopData();
            } catch (err) {
              showToast(err.message || 'Failed to record sale', 'error');
            }
          },
          onCancel: () => {
            setPendingConfirmation(null);
            showToast(lang === 'rw' ? 'Kugurisha byahagaritswe' : 'Sale cancelled', 'info');
          },
        });
      } else {
        showToast(
          lang === 'rw' ? `Ntabwo mbona "${item || 'igicuruzwa'}" mu bubiko.` : `Product "${item || 'item'}" not found in stock.`,
          'error',
        );
      }
      return;
    }

    if (action === 'ADD_STOCK') {
      if (matchedProduct) {
        const qtyToAdd = cmdQty && cmdQty > 0 ? cmdQty : 1;
        setPendingConfirmation({
          action: 'ADD_STOCK',
          title: lang === 'rw' ? 'Emeza Kongera Ububiko' : 'Confirm Restock',
          description: lang === 'rw'
            ? `Kongeraho: +${qtyToAdd} ${formatUnitLabel(cmdUnit || matchedProduct.unit, lang)} kuri ${matchedProduct.name}`
            : `Restock: +${qtyToAdd} ${formatUnitLabel(cmdUnit || matchedProduct.unit, lang)} to ${matchedProduct.name}`,
          onConfirm: async () => {
            setPendingConfirmation(null);
            try {
              const res = await fetch(apiUrl('/api/voice/command'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ command }),
              });
              const data = await res.json();
              if (res.ok && data.ok) {
                setWhatsappLog((prev) => [...prev, { sender: 'shop', text: data.response }]);
                showToast(data.response, 'success');
              } else {
                const ok = await addStock(matchedProduct.id, qtyToAdd);
                if (ok) {
                  showToast(lang === 'rw' ? 'Stock yongerewe neza!' : 'Stock updated successfully!', 'success');
                }
              }
              await refreshShopData();
            } catch (err) {
              showToast(err.message || 'Failed to update stock', 'error');
            }
          },
          onCancel: () => {
            setPendingConfirmation(null);
            showToast(lang === 'rw' ? 'Kongera stock byahagaritswe' : 'Restock cancelled', 'info');
          },
        });
      } else {
        showToast(
          lang === 'rw' ? `Ntabwo mbona "${item || 'igicuruzwa'}" mu bubiko.` : `Product "${item || 'item'}" not found in stock.`,
          'error',
        );
      }
      return;
    }

    // Pass CHECK_STOCK, CHECK_PRICE, DAILY_REPORT, RECORD_DEBT, PAY_DEBT, RECORD_LOSS to server
    try {
      const res = await fetch(apiUrl('/api/voice/command'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setWhatsappLog((prev) => [...prev, { sender: 'shop', text: data.response }]);
        showToast(data.response, 'success');
      } else {
        // Construct clear UI toast based on action
        if (action === 'CHECK_STOCK') {
          const text = matchedProduct
            ? `${matchedProduct.name}: ${formatUnitAmount(matchedProduct.quantity, matchedProduct.unit, lang)} in stock.`
            : 'Could not find product stock.';
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text }]);
          showToast(text, 'info');
        } else if (action === 'CHECK_PRICE') {
          const text = matchedProduct
            ? `${matchedProduct.name}: RWF ${Number(matchedProduct.selling_price).toLocaleString()} / ${formatUnitLabel(matchedProduct.unit, lang)}`
            : 'Could not find product price.';
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text }]);
          showToast(text, 'info');
        } else if (action === 'RECORD_DEBT') {
          const text = `Ideni ryanditswe: ${customer_name || 'Umukiriya'} - ${amount_rwf ? `${amount_rwf.toLocaleString()} RWF` : item || ''}`;
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text }]);
          showToast(text, 'info');
        } else if (action === 'PAY_DEBT') {
          const text = `Kwishyura ideni: ${customer_name || 'Umukiriya'} yishyuye ${amount_rwf ? `${amount_rwf.toLocaleString()} RWF` : ''}`;
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text }]);
          showToast(text, 'info');
        } else if (action === 'RECORD_LOSS') {
          const text = `Ibyangiritse byanditswe: ${cmdQty || ''} ${cmdUnit || ''} ${item || ''}`;
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text }]);
          showToast(text, 'info');
        } else {
          const fallback = data?.message || t.voice.commandFailed;
          setWhatsappLog((prev) => [...prev, { sender: 'shop', text: fallback }]);
          showToast(fallback, 'error');
        }
      }
    } catch (err) {
      setWhatsappLog((prev) => [...prev, { sender: 'shop', text: err.message || t.voice.commandFailed }]);
      showToast(err.message || t.voice.commandFailed, 'error');
    }
  };

  const handleVoiceCommand = async () => {
    if (recording) {
      try {
        const result = await stopRecording(products);
        if (result && result.corrected_text) {
          await routeVoiceCommand(result);
        }
      } catch (err) {
        showToast(err.message || t.voice.couldNotTranscribe, 'error');
      }
    } else {
      try {
        await startRecording();
      } catch (err) {
        showToast(err.message || t.voice.micDenied, 'error');
      }
    }
  };

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

      {feedbackToast && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-fadeIn ${
            feedbackToast.type === 'error'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : feedbackToast.type === 'info'
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
              : 'bg-[#087E73]/20 border-[#08D9C0] text-[#08D9C0]'
          }`}
          role="status"
        >
          {feedbackToast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{feedbackToast.message}</span>
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
          className={`border rounded-3xl p-6 flex flex-col justify-between shadow-sm relative ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  recording
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                    : 'bg-[#087E73]/20 border border-[#08D9C0]/40 text-[#08D9C0] hover:bg-[#087E73]/40'
                }`}
              >
                {recording ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 animate-pulse" />}
                <span>
                  {processingVoice
                    ? t.common.processing
                    : recording
                    ? t.common.stopRecording
                    : t.pos.speakCommand}
                </span>
              </button>
            </div>

            {/* Zero MB Download Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                theme === 'dark' ? 'bg-[#087E73]/10 text-[#08D9C0] border-[#08D9C0]/30' : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}>
                <Sparkles className="w-3 h-3" />
                <span>0 MB Download · Groq Whisper & Llama 3.3</span>
              </span>
            </div>

            {/* Processing Indicator (~1-2 seconds with cold-start reassurance) */}
            {processingVoice && (
              <div
                className={`mb-4 rounded-xl border p-3 text-xs flex items-center gap-3 animate-pulse ${
                  theme === 'dark' ? 'bg-[#07090A] border-[#08D9C0]/40 text-[#08D9C0]' : 'bg-teal-50 border-teal-300 text-teal-900'
                }`}
                role="status"
                aria-live="polite"
              >
                <div className="w-4 h-4 border-2 border-[#08D9C0] border-t-transparent rounded-full animate-spin" />
                <p className="font-semibold">{voiceStatusText || t.voice.processingCommand}</p>
              </div>
            )}

            {voiceError && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400" role="alert">
                {voiceError}
              </div>
            )}

            {/* Pending Voice Action Confirmation Step */}
            {pendingConfirmation && (
              <div className={`mb-4 rounded-2xl border p-4 shadow-lg animate-fadeIn ${
                theme === 'dark' ? 'bg-[#141F20] border-[#08D9C0]/50' : 'bg-teal-50 border-teal-300'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-[#08D9C0]' : 'text-teal-900'}`}>
                    {pendingConfirmation.title}
                  </h4>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#08D9C0]/20 text-[#08D9C0]">
                    Voice Action
                  </span>
                </div>
                <p className={`text-sm mb-3 font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {pendingConfirmation.description}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={pendingConfirmation.onConfirm}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs hover:opacity-95 transition flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.voice.confirmAction || 'Confirm'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={pendingConfirmation.onCancel}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1 ${
                      theme === 'dark' ? 'border-[#202829] text-slate-300 hover:bg-[#07090A]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t.voice.cancelAction || 'Cancel'}</span>
                  </button>
                </div>
              </div>
            )}

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
