import { useEffect, useRef, useState } from 'react';
import {
  ShoppingCart,
  Mic,
  MicOff,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  X,
  Plus,
  Minus,
  TrendingUp,
  Search,
} from 'lucide-react';
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
  const dark = theme === 'dark';

  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [soldBy, setSoldBy] = useState('owner');
  const [successMsg, setSuccessMsg] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [submittingSale, setSubmittingSale] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Derive the active product id cleanly
  const activeProductId = selectedProductId && products.some((p) => String(p.id) === String(selectedProductId))
    ? selectedProductId
    : (products[0] ? String(products[0].id) : '');

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
  const chatBottomRef = useRef(null);

  const selectedProduct = products.find((product) => String(product.id) === String(activeProductId));
  const quantityIsDiscrete = selectedProduct ? discreteProductUnits.has(selectedProduct.unit) : false;
  const numQuantity = Number(quantity) || 0;
  const saleTotal = numQuantity * Number(selectedProduct?.selling_price || 0);
  const unitProfit = selectedProduct ? (Number(selectedProduct.selling_price) - Number(selectedProduct.buying_price)) : 0;
  const totalProfit = unitProfit * numQuantity;
  const isOutOfStock = selectedProduct ? Number(selectedProduct.quantity) <= 0 : false;
  const exceedsStock = selectedProduct ? numQuantity > Number(selectedProduct.quantity) : false;

  // Filter products for quick selection chip list
  const filteredQuickProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || (p.name_kv && p.name_kv.toLowerCase().includes(q));
  });

  useEffect(() => {
    if (location.hash !== '#voice-assistant') return;
    const frameId = window.requestAnimationFrame(() => {
      voiceAssistantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash]);

  // Auto-scroll chat log
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [whatsappLog]);

  const showToast = (message, type = 'success') => {
    setFeedbackToast({ message, type });
    window.setTimeout(() => setFeedbackToast(null), 5000);
  };

  const handleAdjustQuantity = (delta) => {
    setQuantity((prev) => {
      const current = Number(prev) || 0;
      const step = quantityIsDiscrete ? 1 : 0.5;
      const next = Math.max(step, Math.round((current + delta) * 100) / 100);
      return next;
    });
  };

  const handleSetPresetQuantity = (amount) => {
    setQuantity(amount);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    const product = products.find((item) => String(item.id) === String(activeProductId));
    if (!product) {
      setCheckoutError(t.pos.selectProductErr);
      return;
    }
    const saleQuantity = Number(quantity);
    if (!Number.isFinite(saleQuantity) || saleQuantity <= 0) {
      setCheckoutError(t.pos.quantityPositiveErr);
      return;
    }
    if (saleQuantity > Number(product.quantity)) {
      setCheckoutError(
        lang === 'rw'
          ? `Ingano ushaka kugurisha irenga iri muri stock (${product.quantity} bihari).`
          : `Quantity exceeds available stock (${product.quantity} available).`
      );
      return;
    }

    setCheckoutError('');
    setSubmittingSale(true);
    try {
      const recorded = await recordSale(product.id, saleQuantity, soldBy);
      if (recorded) {
        setSuccessMsg(
          t.pos.saleSuccess(
            formatUnitAmount(saleQuantity, product.unit || 'piece', lang),
            product.name || 'product'
          )
        );
        // Reset quantity back to 1 for next sale
        setQuantity(1);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } finally {
      setSubmittingSale(false);
    }
  };

  const handleWhatsAppSend = async (e) => {
    e?.preventDefault?.();
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

  const handleRunExample = (exampleText) => {
    // Strip quotes
    const clean = exampleText.replace(/^["“”']|["“”']$/g, '');
    setWhatsappText(clean);
  };

  // Route structured JSON command from /api/transcribe to app action handlers
  const routeVoiceCommand = async (command) => {
    const { action, item, quantity: cmdQty, unit: cmdUnit, amount_rwf, customer_name, corrected_text } = command;

    setWhatsappLog((prev) => [...prev, { sender: 'user', text: corrected_text }]);

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

        setPendingConfirmation({
          action: 'SELL',
          title: lang === 'rw' ? 'Emeza Kugurisha' : 'Confirm Sale',
          description:
            lang === 'rw'
              ? `Kugurisha: ${qtyToSell} ${formatUnitLabel(cmdUnit || matchedProduct.unit, lang)} bya ${matchedProduct.name} (RWF ${totalAmount.toLocaleString()})`
              : `Sell: ${qtyToSell} ${formatUnitLabel(cmdUnit || matchedProduct.unit, lang)} of ${matchedProduct.name} (RWF ${totalAmount.toLocaleString()})`,
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
                const ok = await recordSale(matchedProduct.id, qtyToSell, soldBy);
                if (ok) {
                  showToast(lang === 'rw' ? 'Byagurishijwe neza!' : 'Sale recorded successfully!', 'success');
                  setWhatsappLog((prev) => [
                    ...prev,
                    {
                      sender: 'shop',
                      text: `Byagurishijwe: ${qtyToSell} ${matchedProduct.unit} bya ${matchedProduct.name}.`,
                    },
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
          'error'
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
          description:
            lang === 'rw'
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
          'error'
        );
      }
      return;
    }

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

  const exampleChips = [
    { label: t.pos.example1, raw: 'Gurisha umuceri ibiro 2' },
    { label: t.pos.example2, raw: 'Ongeraho isukari kg 5' },
    { label: t.pos.example6, raw: 'Reba ububiko' },
    { label: t.pos.example7, raw: 'Raporo y’uyu munsi' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.pos.title}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
            {t.pos.subtitle}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0] text-[#08D9C0] font-semibold text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn shadow-lg shadow-[#08D9C0]/10"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {feedbackToast && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fadeIn shadow-lg ${
            feedbackToast.type === 'error'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : feedbackToast.type === 'info'
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
              : 'bg-[#087E73]/20 border-[#08D9C0] text-[#08D9C0]'
          }`}
          role="status"
        >
          {feedbackToast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: FAST CHECKOUT TILL (7 cols on large screens) */}
        {/* ============================================================ */}
        <div
          className={`lg:col-span-7 border rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col justify-between transition-colors ${
            dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-base sm:text-lg ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {t.pos.fastCheckout}
                </h3>
                <p className={`text-xs ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
                  {t.pos.fastCheckoutSub}
                </p>
              </div>
            </div>

            {/* Quick Item Picker Chips */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {lang === 'rw' ? 'Hitamo vuba' : 'Quick Tap Items'}
                </span>
                {products.length > 4 && (
                  <div className="relative w-36 sm:w-44">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={lang === 'rw' ? 'Gushakisha...' : 'Filter...'}
                      className={`w-full pl-6 pr-2 py-1 text-xs rounded-lg border focus:outline-none ${
                        dark
                          ? 'bg-[#07090A] border-[#202829] text-white focus:border-[#08D9C0]'
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#087E73]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Scrollable quick-select chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {filteredQuickProducts.slice(0, 10).map((p) => {
                  const isSelected = String(p.id) === String(activeProductId);
                  const isProductOut = Number(p.quantity) <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(String(p.id))}
                      className={`shrink-0 px-3 py-2 rounded-xl text-left border text-xs transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#08D9C0]/15 border-[#08D9C0] text-[#08D9C0] ring-1 ring-[#08D9C0]'
                          : dark
                          ? 'bg-[#07090A] border-[#202829] text-slate-300 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      } ${isProductOut ? 'opacity-50' : ''}`}
                    >
                      <div className="font-bold truncate max-w-[110px]">{p.name}</div>
                      <div className="text-[10px] font-medium opacity-80">
                        RWF {Number(p.selling_price).toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              {/* Product Select Dropdown */}
              <div>
                <label
                  htmlFor="pos-product-select"
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    dark ? 'text-[#B4BABB]' : 'text-slate-600'
                  }`}
                >
                  {t.pos.selectProduct}
                </label>
                <select
                  id="pos-product-select"
                  value={activeProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className={`w-full rounded-xl px-3.5 py-3 text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                    dark
                      ? 'bg-[#07090A] border-[#202829] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
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

              {/* Quantity Section with Stepper & Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="pos-quantity-input"
                    className={`block text-xs font-semibold uppercase tracking-wider ${
                      dark ? 'text-[#B4BABB]' : 'text-slate-600'
                    }`}
                  >
                    {t.pos.quantityToSell} {selectedProduct ? `(${formatUnitLabel(selectedProduct.unit, lang)})` : ''}
                  </label>
                  {selectedProduct && (
                    <span
                      className={`text-xs font-semibold ${
                        isOutOfStock
                          ? 'text-rose-400'
                          : Number(selectedProduct.quantity) <= Number(selectedProduct.low_stock_threshold)
                          ? 'text-amber-400'
                          : dark ? 'text-[#08D9C0]' : 'text-[#087E73]'
                      }`}
                    >
                      {formatUnitAmount(selectedProduct.quantity, selectedProduct.unit, lang)} {t.pos.availableSuffix}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustQuantity(-1)}
                    disabled={numQuantity <= (quantityIsDiscrete ? 1 : 0.5)}
                    aria-label="Decrease quantity"
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center font-bold text-base transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${
                      dark
                        ? 'bg-[#07090A] border-[#202829] text-white hover:border-[#08D9C0]'
                        : 'bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    id="pos-quantity-input"
                    type="number"
                    step={quantityIsDiscrete ? '1' : '0.1'}
                    min={quantityIsDiscrete ? '1' : '0.1'}
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={`flex-1 rounded-xl px-4 py-3 text-center text-base sm:text-lg font-bold border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                      dark
                        ? 'bg-[#07090A] border-[#202829] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => handleAdjustQuantity(1)}
                    disabled={selectedProduct && numQuantity >= Number(selectedProduct.quantity)}
                    aria-label="Increase quantity"
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center font-bold text-base transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${
                      dark
                        ? 'bg-[#07090A] border-[#202829] text-white hover:border-[#08D9C0]'
                        : 'bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Quantity Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className={`text-[10px] font-semibold uppercase ${dark ? 'text-slate-500' : 'text-slate-400'} mr-1`}>
                    Presets:
                  </span>
                  {[1, 2, 5, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSetPresetQuantity(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition active:scale-95 ${
                        numQuantity === preset
                          ? 'bg-[#08D9C0] text-black border-[#08D9C0]'
                          : dark
                          ? 'bg-[#07090A] border-[#202829] text-slate-300 hover:border-slate-700'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  {selectedProduct && Number(selectedProduct.quantity) > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetPresetQuantity(Number(selectedProduct.quantity))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition active:scale-95 ${
                        dark
                          ? 'bg-[#07090A] border-[#202829] text-[#08D9C0] hover:border-[#08D9C0]'
                          : 'bg-teal-50 border-teal-200 text-[#087E73] hover:bg-teal-100'
                      }`}
                    >
                      Max ({selectedProduct.quantity})
                    </button>
                  )}
                </div>

                {exceedsStock && (
                  <p className="text-xs text-rose-400 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {lang === 'rw'
                      ? `Ingano ushaka igomba kutarenga stock (${selectedProduct.quantity})`
                      : `Quantity exceeds in-stock amount (${selectedProduct.quantity})`}
                  </p>
                )}
              </div>

              {/* Cashier / Sold By Selector */}
              <div>
                <label
                  htmlFor="pos-sold-by"
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    dark ? 'text-[#B4BABB]' : 'text-slate-600'
                  }`}
                >
                  {t.pos.soldBy}
                </label>
                <select
                  id="pos-sold-by"
                  value={soldBy}
                  onChange={(e) => setSoldBy(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm border focus:outline-none focus:border-[#08D9C0] transition ${
                    dark
                      ? 'bg-[#07090A] border-[#202829] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="owner">{t.common.owner}</option>
                  <option value="worker">{t.common.worker}</option>
                </select>
              </div>

              {/* Order Calculation Preview Card */}
              {selectedProduct && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    dark ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center text-slate-400">
                    <span>
                      {selectedProduct.name} ({numQuantity} × RWF {Number(selectedProduct.selling_price).toLocaleString()})
                    </span>
                    <span className="font-semibold text-white">
                      RWF {saleTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#08D9C0]">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {lang === 'rw' ? 'Inyungu y’aka kanya' : 'Instant Net Profit'}
                    </span>
                    <span className="font-bold">+RWF {totalProfit.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <button
                type="submit"
                disabled={!selectedProduct || isOutOfStock || exceedsStock || submittingSale}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-extrabold text-sm sm:text-base hover:opacity-95 transition-all shadow-xl shadow-[#08D9C0]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>
                  {submittingSale
                    ? t.common.processing
                    : selectedProduct && !isOutOfStock && !exceedsStock
                    ? `${t.pos.completeSale} · RWF ${Number.isFinite(saleTotal) ? saleTotal.toLocaleString() : '0'}`
                    : t.pos.noStockAvailable}
                </span>
              </button>
              {checkoutError && (
                <p className="text-xs sm:text-sm text-red-500 font-semibold" role="alert">
                  {checkoutError}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: WHATSAPP & VOICE BOT (5 cols on large screens) */}
        {/* ============================================================ */}
        <div
          id="voice-assistant"
          ref={voiceAssistantRef}
          className={`lg:col-span-5 border rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-sm relative transition-colors ${
            dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base sm:text-lg ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {t.pos.whatsappBotTitle}
                  </h3>
                  <p className={`text-xs ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
                    {t.pos.whatsappBotSub}
                  </p>
                </div>
              </div>

              {/* Speak Command Toggle Button */}
              <button
                type="button"
                onClick={handleVoiceCommand}
                disabled={processingVoice}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md ${
                  recording
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                    : dark
                    ? 'bg-[#087E73]/20 border border-[#08D9C0]/40 text-[#08D9C0] hover:bg-[#087E73]/40'
                    : 'bg-teal-50 border border-teal-200 text-[#087E73] hover:bg-teal-100'
                }`}
              >
                {recording ? (
                  <MicOff className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4 animate-bounce" />
                )}
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
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                  dark
                    ? 'bg-[#087E73]/10 text-[#08D9C0] border-[#08D9C0]/30'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#08D9C0]" />
                <span>0 MB Download · Groq Whisper & Llama 3.3</span>
              </span>
            </div>

            {/* Processing Voice Status Indicator */}
            {processingVoice && (
              <div
                className={`mb-4 rounded-xl border p-3 text-xs flex items-center gap-3 animate-pulse ${
                  dark
                    ? 'bg-[#07090A] border-[#08D9C0]/40 text-[#08D9C0]'
                    : 'bg-teal-50 border-teal-300 text-teal-900'
                }`}
                role="status"
                aria-live="polite"
              >
                <div className="w-4 h-4 border-2 border-[#08D9C0] border-t-transparent rounded-full animate-spin shrink-0" />
                <p className="font-semibold">{voiceStatusText || t.voice.processingCommand}</p>
              </div>
            )}

            {voiceError && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-medium" role="alert">
                {voiceError}
              </div>
            )}

            {/* Pending Voice Action Confirmation Step */}
            {pendingConfirmation && (
              <div
                className={`mb-4 rounded-2xl border p-4 shadow-xl animate-fadeIn ${
                  dark ? 'bg-[#141F20] border-[#08D9C0]/50' : 'bg-teal-50 border-teal-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-[#08D9C0]' : 'text-teal-900'}`}>
                    {pendingConfirmation.title}
                  </h4>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#08D9C0]/20 text-[#08D9C0]">
                    Voice Action
                  </span>
                </div>
                <p className={`text-xs sm:text-sm mb-3 font-medium ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {pendingConfirmation.description}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={pendingConfirmation.onConfirm}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs hover:opacity-95 transition flex items-center justify-center gap-1 active:scale-95 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.voice.confirmAction || 'Confirm'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={pendingConfirmation.onCancel}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1 active:scale-95 ${
                      dark
                        ? 'border-[#202829] text-slate-300 hover:bg-[#07090A]'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t.voice.cancelAction || 'Cancel'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Chat Log with smooth scrolling */}
            <div
              className={`h-[200px] sm:h-[220px] overflow-y-auto rounded-2xl p-3 sm:p-4 space-y-2.5 mb-3 border ${
                dark ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {whatsappLog.map((log, idx) => (
                <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      log.sender === 'user'
                        ? 'bg-[#08D9C0] text-black font-semibold rounded-br-none'
                        : dark
                        ? 'bg-[#101516] border border-[#202829] text-white rounded-bl-none'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                    }`}
                  >
                    {log.isInitial ? t.pos.initialBotMsg : log.text}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Interactive Example Command Chips */}
            <div
              className={`mb-4 rounded-xl border p-3 text-xs ${
                dark ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className={`mb-2 font-bold text-[11px] uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.pos.examplesTitle} ({lang === 'rw' ? 'Kanda kugira ngo wandike' : 'Tap to insert'}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exampleChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRunExample(chip.raw)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition active:scale-95 text-left ${
                      dark
                        ? 'bg-[#101516] border-[#202829] text-[#08D9C0] hover:border-[#08D9C0]'
                        : 'bg-white border-slate-200 text-[#087E73] hover:border-[#087E73]'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Text Command Input Form */}
          <form onSubmit={handleWhatsAppSend} className="flex gap-2">
            <input
              type="text"
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              placeholder={t.pos.commandPlaceholder}
              className={`flex-1 rounded-xl px-3.5 py-3 text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                dark
                  ? 'bg-[#07090A] border-[#202829] text-white placeholder-[#747E80]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              aria-label={t.common.send}
              className="px-4 sm:px-5 py-3 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold hover:opacity-95 transition-transform active:scale-95 flex items-center justify-center shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
