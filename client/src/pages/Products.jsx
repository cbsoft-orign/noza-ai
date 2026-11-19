import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Plus, Search, Sparkles, AlertTriangle, PackagePlus } from 'lucide-react';
import { useApp } from '../context/useApp';
import { apiUrl } from '../api';
import { discreteProductUnits, formatUnitAmount, formatUnitLabel, productUnits, suggestProductUnit } from '../data/productUnits';

export default function Products() {
  const { shop, products, addProduct, addStock, theme } = useApp();
  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';
  const [searchState, setSearchState] = useState(() => ({ source: searchFromUrl, value: searchFromUrl }));
  const search = searchState.source === searchFromUrl ? searchState.value : searchFromUrl;
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
  const filteredProducts = products.filter((product) =>
    [product.name, product.name_kv].some((name) => name?.toLocaleLowerCase().includes(normalizedSearch)),
  );

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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Inventory & Products</h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Manage stock items, unit margins, and Free Plan limits (10 products max).</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleImageScan}
            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition flex items-center gap-2 ${
              theme === 'dark' ? 'bg-[#101516] border-[#202829] text-[#08D9C0] hover:border-[#08D9C0]' : 'bg-white border-slate-200 text-[#087E73] hover:border-[#087E73]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{scanning ? 'Scanning Shelf...' : 'AI Shelf Scanner'}</span>
          </button>
          <button
            onClick={openAddProduct}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-sm hover:opacity-95 transition shadow-lg shadow-[#08D9C0]/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Free Plan Meter */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-[#08D9C0]" />
          <div>
            <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Free Plan Product Usage: {products.length} / 10 items</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Upgrade to Daily (200 RWF) or Monthly (5,000 RWF) for unlimited products.</p>
          </div>
        </div>
        <div className={`w-32 rounded-full h-2.5 overflow-hidden border ${theme === 'dark' ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-100 border-slate-200'}`}>
          <div className="bg-[#08D9C0] h-full rounded-full" style={{ width: `${Math.min(100, (products.length / 10) * 100)}%` }} />
        </div>
      </div>

      {/* AI Scan Results banner */}
      {scanResult && (
        <div className={`p-5 rounded-xl border space-y-3 ${theme === 'dark' ? 'bg-[#0C1112] border-[#08D9C0]/40' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-[#08D9C0]' : 'text-[#087E73]'}`} /> AI Shelf Scan Detected Items
            </h3>
            <button onClick={() => setScanResult(null)} className={`text-xs ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scanResult.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-[#08D9C0]' : 'text-[#087E73]'}`}>Est. Price: RWF {item.estimated_price?.toLocaleString()}</p>
                </div>
                <button
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
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${theme === 'dark' ? 'bg-[#087E73]/20 border-[#08D9C0]/40 text-[#08D9C0] hover:bg-[#087E73]/40' : 'bg-white border-teal-200 text-[#087E73] hover:bg-teal-50'}`}
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Table */}
      <div className={`border rounded-2xl overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'} flex items-center justify-between`}>
          <div className="relative w-[320px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747E80]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearchState({ source: searchFromUrl, value: e.target.value })}
              placeholder="Search products by name..."
              className={`w-full rounded-xl pl-10 pr-4 py-2 text-sm transition focus:outline-none focus:border-[#08D9C0] border ${
                theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white placeholder-[#747E80]' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-[#202829] bg-[#0C1112] text-[#B4BABB]' : 'border-slate-200 bg-slate-50 text-slate-600'} text-xs font-semibold uppercase tracking-wider`}>
                <th className="py-4 px-6">Product Name</th>
                <th className="py-4 px-6">Cost / unit</th>
                <th className="py-4 px-6">Selling / unit</th>
                <th className="py-4 px-6">Unit Margin</th>
                <th className="py-4 px-6">Stock Quantity</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#202829]' : 'divide-slate-200'} text-sm`}>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`py-10 text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {normalizedSearch ? 'No products match this search.' : 'No products yet. Add your first product to track stock.'}
                  </td>
                </tr>
              ) : filteredProducts.map((p) => {
                const margin = p.selling_price - p.buying_price;
                const isLow = p.quantity <= p.low_stock_threshold;
                return (
                  <tr key={p.id} className={`transition ${theme === 'dark' ? 'hover:bg-[#07090A]/50' : 'hover:bg-slate-50'}`}>
                    <td className={`py-4 px-6 font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {p.name} <span className={`text-xs font-normal ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>({formatUnitLabel(p.unit)})</span>
                    </td>
                    <td className={`py-4 px-6 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>RWF {p.buying_price.toLocaleString()} / {formatUnitLabel(p.unit)}</td>
                    <td className={`py-4 px-6 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>RWF {p.selling_price.toLocaleString()} <span className="font-normal text-xs text-slate-500">/ {formatUnitLabel(p.unit)}</span></td>
                    <td className={`py-4 px-6 font-semibold ${theme === 'dark' ? 'text-[#08D9C0]' : 'text-[#087E73]'}`}>+RWF {margin.toLocaleString()}</td>
                    <td className={`py-4 px-6 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {formatUnitAmount(p.quantity, p.unit)}
                    </td>
                    <td className="py-4 px-6">
                      {isLow ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${theme === 'dark' ? 'bg-[#08D9C0]/10 border-[#08D9C0]/30 text-[#08D9C0]' : 'bg-teal-50 border-teal-200 text-[#087E73]'}`}>
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => {
                          setProductToRestock(p);
                          setRestockQuantity('');
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                          theme === 'dark'
                            ? 'border-[#08D9C0]/40 text-[#08D9C0] hover:bg-[#08D9C0]/10'
                            : 'border-teal-200 text-[#087E73] hover:bg-teal-50'
                        }`}
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        Add stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`border rounded-3xl p-6 w-full max-w-md shadow-2xl ${theme === 'dark' ? 'bg-[#101516] border-[#202829] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-xl font-bold mb-1">Add a product</h3>
            <p className={`text-sm mb-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Enter its selling unit, starting stock, and prices per unit.
            </p>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!unitManuallySelected) setUnit(suggestProductUnit(e.target.value));
                  }}
                  placeholder="e.g. Ibirayi, Umuceri, Isabune"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                    theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Cost per {formatUnitLabel(unit)} (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                    placeholder="900"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                      theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Selling price per {formatUnitLabel(unit)} (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="1250"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                      theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Starting stock ({formatUnitLabel(unit)})</label>
                  <input
                    type="number"
                    min="0"
                    step={discreteProductUnits.has(unit) ? '1' : '0.01'}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="10"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                      theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Sold by</label>
                  <select
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      setUnitManuallySelected(true);
                    }}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                      theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {productUnits.map((productUnit) => (
                      <option key={productUnit.value} value={productUnit.value}>{productUnit.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className={`text-xs -mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Unit is suggested from the product name. Confirm how you buy and sell it; for example, ibirayi are usually sold by kg.
              </p>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm ${theme === 'dark' ? 'bg-[#07090A] text-[#B4BABB] hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-sm hover:opacity-95"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {productToRestock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl border p-6 ${theme === 'dark' ? 'bg-[#101516] border-[#202829] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-lg font-semibold">Add stock</h3>
            <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {productToRestock.name} · Current stock: {formatUnitAmount(productToRestock.quantity, productToRestock.unit)}
            </p>
            <form onSubmit={handleRestock} className="mt-5 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Quantity received ({formatUnitLabel(productToRestock.unit)})
                </label>
                <input
                  type="number"
                  min={discreteProductUnits.has(productToRestock.unit) ? '1' : '0.01'}
                  step={discreteProductUnits.has(productToRestock.unit) ? '1' : '0.01'}
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-[#087E73]/20 focus:border-[#087E73] ${
                    theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductToRestock(null)}
                  className={`px-4 py-2 rounded-lg text-sm ${theme === 'dark' ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#087E73] text-white text-sm font-semibold hover:bg-[#06665e]">
                  Confirm stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
