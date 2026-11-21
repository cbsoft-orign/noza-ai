import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Sparkles,
  AlertTriangle,
  PackagePlus,
  X,
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import {
  discreteProductUnits,
  formatUnitAmount,
  formatUnitLabel,
  productUnits,
  suggestProductUnit,
} from '../data/productUnits';
import { getTranslations } from '../data/translations';

export default function Products() {
  const { shop, products, addProduct, addStock, theme, lang } = useApp();
  const t = getTranslations(lang);
  const dark = theme === 'dark';

  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';
  const [searchState, setSearchState] = useState(() => ({ source: searchFromUrl, value: searchFromUrl }));
  const search = searchState.source === searchFromUrl ? searchState.value : searchFromUrl;

  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'low' | 'in'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToRestock, setProductToRestock] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [name, setName] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('piece');
  const [unitManuallySelected, setUnitManuallySelected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const normalizedSearch = search.trim().toLocaleLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesSearch = [product.name, product.name_kv].some((itemName) =>
      itemName?.toLocaleLowerCase().includes(normalizedSearch)
    );
    if (!matchesSearch) return false;

    if (statusFilter === 'low') {
      return product.quantity <= product.low_stock_threshold;
    }
    if (statusFilter === 'in') {
      return product.quantity > product.low_stock_threshold;
    }
    return true;
  });

  const lowStockCount = products.filter((p) => p.quantity <= p.low_stock_threshold).length;
  const inStockCount = products.filter((p) => p.quantity > p.low_stock_threshold).length;

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const success = await addProduct({
      name,
      name_kv: name.toLowerCase(),
      buying_price: Number(buyingPrice) || 0,
      selling_price: Number(sellingPrice) || 0,
      quantity: Number(quantity) || 0,
      unit,
      low_stock_threshold: 3,
    });
    if (success) {
      setName('');
      setBuyingPrice('');
      setSellingPrice('');
      setQuantity('');
      setUnit('piece');
      setUnitManuallySelected(false);
      setIsAddModalOpen(false);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!productToRestock) return;
    const success = await addStock(productToRestock.id, Number(restockQuantity));
    if (success) {
      setRestockQuantity('');
      setProductToRestock(null);
    }
  };

  const openAddProduct = () => {
    setName('');
    setBuyingPrice('');
    setSellingPrice('');
    setQuantity('');
    setUnit('piece');
    setUnitManuallySelected(false);
    setIsAddModalOpen(true);
  };

  const handleImageScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(apiUrl('/api/products/from-image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ village: shop.village }),
      });
      const data = await res.json();
      if (data.ok && data.items) {
        setScanResult(data.items);
      }
    } catch {
      setScanResult([
        { name: 'Umuceri (Imported)', estimated_price: 1600, confidence: 0.95 },
        { name: 'Isukari (Imported)', estimated_price: 1300, confidence: 0.92 },
      ]);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.products.title}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
            {t.products.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleImageScan}
            disabled={scanning}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition active:scale-95 flex items-center gap-2 ${
              dark
                ? 'bg-[#101516] border-[#202829] text-[#08D9C0] hover:border-[#08D9C0]'
                : 'bg-white border-slate-200 text-[#087E73] hover:border-[#087E73]'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{scanning ? t.products.scanningShelf : t.products.aiShelfScanner}</span>
          </button>
          <button
            type="button"
            onClick={openAddProduct}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs sm:text-sm hover:opacity-95 transition-transform active:scale-95 shadow-lg shadow-[#08D9C0]/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[3]" />
            <span>{t.products.addProduct}</span>
          </button>
        </div>
      </div>

      {/* Free Plan Meter */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
          dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-xs sm:text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
              {t.products.freePlanUsage(products.length)}
            </p>
            <p className={`text-[11px] sm:text-xs ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
              {t.products.freePlanUpgradeHint}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className={`flex-1 sm:w-36 rounded-full h-2.5 overflow-hidden border ${
              dark ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <div
              className="bg-gradient-to-r from-[#087E73] to-[#08D9C0] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (products.length / 10) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold shrink-0">{products.length}/10</span>
        </div>
      </div>

      {/* AI Shelf Scan Results Banner */}
      {scanResult && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border space-y-3 animate-fadeIn ${
            dark ? 'bg-[#0C1112] border-[#08D9C0]/40' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-sm sm:text-base flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className={`w-4 h-4 ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`} />
              {t.products.scanDetectedTitle}
            </h3>
            <button
              type="button"
              onClick={() => setScanResult(null)}
              className={`p-1 rounded-lg ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scanResult.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  dark ? 'bg-[#101516] border-[#202829]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <p className={`font-semibold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                  <p className={`text-xs ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`}>
                    {t.products.estPrice} RWF {item.estimated_price?.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    addProduct({
                      name: item.name,
                      name_kv: item.name.toLowerCase(),
                      buying_price: Math.round(item.estimated_price * 0.8),
                      selling_price: item.estimated_price,
                      quantity: 10,
                      unit: item.unit || suggestProductUnit(item.name),
                      low_stock_threshold: 2,
                    }).then((success) => {
                      if (success) setScanResult(null);
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-95 shrink-0 ${
                    dark
                      ? 'bg-[#087E73]/20 border-[#08D9C0]/40 text-[#08D9C0] hover:bg-[#087E73]/40'
                      : 'bg-white border-teal-200 text-[#087E73] hover:bg-teal-50'
                  }`}
                >
                  {t.products.importBtn}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Catalog Container */}
      <div
        className={`border rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm transition-colors ${
          dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Search & Filter Toolbar */}
        <div
          className={`p-3.5 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            dark ? 'border-[#202829]' : 'border-slate-200'
          }`}
        >
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearchState({ source: searchFromUrl, value: e.target.value })}
              placeholder={t.products.searchPlaceholder}
              className={`w-full rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm transition focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] border ${
                dark
                  ? 'bg-[#07090A] border-[#202829] text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearchState({ source: searchFromUrl, value: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 active:scale-95 ${
                statusFilter === 'all'
                  ? 'bg-[#08D9C0] text-black font-bold'
                  : dark
                  ? 'bg-[#07090A] text-slate-300 hover:text-white border border-[#202829]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lang === 'rw' ? 'Byose' : 'All'} ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('low')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 active:scale-95 ${
                statusFilter === 'low'
                  ? 'bg-amber-500 text-black font-bold'
                  : dark
                  ? 'bg-[#07090A] text-amber-400 hover:bg-amber-500/10 border border-amber-500/30'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              {t.products.lowStock} ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 active:scale-95 ${
                statusFilter === 'in'
                  ? 'bg-emerald-500 text-black font-bold'
                  : dark
                  ? 'bg-[#07090A] text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {t.products.inStock} ({inStockCount})
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE VIEW (< md): Ergonomic Product Cards */}
        {/* ============================================================ */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#202829]">
          {filteredProducts.length === 0 ? (
            <div className={`py-12 text-center text-xs sm:text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              {normalizedSearch ? t.products.noMatch : t.products.noProducts}
            </div>
          ) : (
            filteredProducts.map((p) => {
              const margin = p.selling_price - p.buying_price;
              const isLow = p.quantity <= p.low_stock_threshold;
              return (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`font-bold text-sm sm:text-base ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {p.name}
                      </h4>
                      <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatUnitLabel(p.unit, lang)}
                      </p>
                    </div>
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold bg-amber-500/10 border-amber-500/30 text-amber-400">
                        <AlertTriangle className="w-3 h-3" /> {t.products.lowStock}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold bg-[#08D9C0]/10 border-[#08D9C0]/30 text-[#08D9C0]">
                        {t.products.inStock}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#07090A] text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">{t.products.colSelling}</span>
                      <span className={`font-bold text-xs sm:text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>
                        RWF {p.selling_price.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">{t.products.colMargin}</span>
                      <span className={`font-bold text-xs sm:text-sm ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`}>
                        +RWF {margin.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">{t.products.colStock}</span>
                      <span className={`font-bold text-xs sm:text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {formatUnitAmount(p.quantity, p.unit, lang)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProductToRestock(p);
                        setRestockQuantity('');
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        dark
                          ? 'border-[#08D9C0]/40 text-[#08D9C0] hover:bg-[#08D9C0]/10'
                          : 'border-teal-200 text-[#087E73] hover:bg-teal-50'
                      }`}
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>{t.products.addStockBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ============================================================ */}
        {/* DESKTOP / TABLET VIEW (md+): Full Multi-Column Table */}
        {/* ============================================================ */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b text-xs font-semibold uppercase tracking-wider ${
                  dark ? 'border-[#202829] bg-[#0C1112] text-[#B4BABB]' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <th className="py-4 px-6">{t.products.colName}</th>
                <th className="py-4 px-6">{t.products.colCost}</th>
                <th className="py-4 px-6">{t.products.colSelling}</th>
                <th className="py-4 px-6">{t.products.colMargin}</th>
                <th className="py-4 px-6">{t.products.colStock}</th>
                <th className="py-4 px-6">{t.products.colStatus}</th>
                <th className="py-4 px-6 text-right">{t.products.colActions}</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${dark ? 'divide-[#202829]' : 'divide-slate-200'}`}>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`py-12 text-center ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {normalizedSearch ? t.products.noMatch : t.products.noProducts}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = p.selling_price - p.buying_price;
                  const isLow = p.quantity <= p.low_stock_threshold;
                  return (
                    <tr
                      key={p.id}
                      className={`transition ${dark ? 'hover:bg-[#07090A]/50' : 'hover:bg-slate-50'}`}
                    >
                      <td className={`py-4 px-6 font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {p.name}{' '}
                        <span className={`text-xs font-normal ${dark ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
                          ({formatUnitLabel(p.unit, lang)})
                        </span>
                      </td>
                      <td className={`py-4 px-6 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                        RWF {p.buying_price.toLocaleString()} / {formatUnitLabel(p.unit, lang)}
                      </td>
                      <td className={`py-4 px-6 font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                        RWF {p.selling_price.toLocaleString()}{' '}
                        <span className="font-normal text-xs text-slate-500">/ {formatUnitLabel(p.unit, lang)}</span>
                      </td>
                      <td className={`py-4 px-6 font-semibold ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`}>
                        +RWF {margin.toLocaleString()}
                      </td>
                      <td className={`py-4 px-6 font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {formatUnitAmount(p.quantity, p.unit, lang)}
                      </td>
                      <td className="py-4 px-6">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold bg-amber-500/10 border-amber-500/30 text-amber-400">
                            <AlertTriangle className="w-3 h-3" /> {t.products.lowStock}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold bg-[#08D9C0]/10 border-[#08D9C0]/30 text-[#08D9C0]">
                            {t.products.inStock}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setProductToRestock(p);
                            setRestockQuantity('');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                            dark
                              ? 'border-[#08D9C0]/40 text-[#08D9C0] hover:bg-[#08D9C0]/10'
                              : 'border-teal-200 text-[#087E73] hover:bg-teal-50'
                          }`}
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          {t.products.addStockBtn}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ADD PRODUCT MODAL (Scrollable, mobile-responsive) */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div
            className={`border rounded-3xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl ${
              dark ? 'bg-[#101516] border-[#202829] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold">{t.products.modalAddTitle}</h3>
                <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t.products.modalAddSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1.5 rounded-lg ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                  {t.products.productNameLabel}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!unitManuallySelected) setUnit(suggestProductUnit(e.target.value));
                  }}
                  placeholder={t.products.productNamePlaceholder}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                    dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                    {t.products.costPerUnit(formatUnitLabel(unit, lang))}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                    placeholder="900"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                      dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                    {t.products.sellingPerUnit(formatUnitLabel(unit, lang))}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="1250"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                      dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                    {t.products.startingStock(formatUnitLabel(unit, lang))}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={discreteProductUnits.has(unit) ? '1' : '0.01'}
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="10"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                      dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                    {t.products.soldBy}
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      setUnitManuallySelected(true);
                    }}
                    className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                      dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {productUnits.map((productUnit) => (
                      <option key={productUnit.value} value={productUnit.value}>
                        {lang === 'rw' ? productUnit.labelRw : productUnit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t.products.unitHint}
              </p>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${dark ? 'border-[#202829]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    dark ? 'bg-[#07090A] text-[#B4BABB] hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs sm:text-sm hover:opacity-95 shadow-md active:scale-95 transition-transform"
                >
                  {t.products.createProductBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* RESTOCK MODAL */}
      {/* ============================================================ */}
      {productToRestock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl ${
              dark ? 'bg-[#101516] border-[#202829] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold">{t.products.restockTitle}</h3>
              <button
                type="button"
                onClick={() => setProductToRestock(null)}
                className={`p-1 rounded-lg ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-xs sm:text-sm mb-4 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              {productToRestock.name} · {t.products.currentStock}{' '}
              <strong className={dark ? 'text-white' : 'text-slate-900'}>
                {formatUnitAmount(productToRestock.quantity, productToRestock.unit, lang)}
              </strong>
            </p>
            <form onSubmit={handleRestock} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.products.qtyReceived(formatUnitLabel(productToRestock.unit, lang))}
                </label>
                <input
                  type="number"
                  min={discreteProductUnits.has(productToRestock.unit) ? '1' : '0.01'}
                  step={discreteProductUnits.has(productToRestock.unit) ? '1' : '0.01'}
                  inputMode="decimal"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  placeholder="e.g. 10"
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                    dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToRestock(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs sm:text-sm hover:opacity-95 shadow-md active:scale-95 transition-transform"
                >
                  {t.products.confirmStock}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
