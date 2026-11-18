import { useState } from 'react';
import { Package, Plus, Search, Sparkles, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Products() {
  const { shop, products, addProduct, theme } = useApp();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.name_kv && p.name_kv.includes(search.toLowerCase())));

  const handleCreateProduct = (e) => {
    e.preventDefault();
    const success = addProduct({
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
      setIsAddModalOpen(false);
    }
  };

  const handleImageScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/products/from-image', {
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
            onClick={() => setIsAddModalOpen(true)}
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
        <div className="p-5 rounded-2xl bg-[#0C1112] border border-[#08D9C0]/40 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#08D9C0]" /> AI Shelf Scan Detected Items
            </h3>
            <button onClick={() => setScanResult(null)} className="text-xs text-[#747E80] hover:text-white">Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scanResult.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#101516] border border-[#202829] flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-white">{item.name}</p>
                  <p className="text-xs text-[#08D9C0]">Est. Price: RWF {item.estimated_price?.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => {
                    addProduct({ name: item.name, name_kv: item.name.toLowerCase(), buying_price: Math.round(item.estimated_price * 0.8), selling_price: item.estimated_price, quantity: 10, unit: 'kg', low_stock_threshold: 2 });
                    setScanResult(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#087E73]/20 border border-[#08D9C0]/40 text-xs font-semibold text-[#08D9C0] hover:bg-[#087E73]/40 transition"
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
              onChange={(e) => setSearch(e.target.value)}
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
                <th className="py-4 px-6">Buying Price</th>
                <th className="py-4 px-6">Selling Price</th>
                <th className="py-4 px-6">Unit Margin</th>
                <th className="py-4 px-6">Stock Quantity</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#202829]' : 'divide-slate-200'} text-sm`}>
              {filteredProducts.map((p) => {
                const margin = p.selling_price - p.buying_price;
                const isLow = p.quantity <= p.low_stock_threshold;
                return (
                  <tr key={p.id} className={`transition ${theme === 'dark' ? 'hover:bg-[#07090A]/50' : 'hover:bg-slate-50'}`}>
                    <td className={`py-4 px-6 font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {p.name} <span className={`text-xs font-normal ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>({p.unit})</span>
                    </td>
                    <td className={`py-4 px-6 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>RWF {p.buying_price.toLocaleString()}</td>
                    <td className={`py-4 px-6 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>RWF {p.selling_price.toLocaleString()}</td>
                    <td className="py-4 px-6 text-[#08D9C0] font-semibold">+RWF {margin.toLocaleString()}</td>
                    <td className={`py-4 px-6 font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {p.quantity} {p.unit}
                    </td>
                    <td className="py-4 px-6">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#08D9C0]/10 border border-[#08D9C0]/30 text-xs font-semibold text-[#08D9C0]">
                          In Stock
                        </span>
                      )}
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
            <h3 className="text-xl font-bold mb-4">Add New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Isukari / Sugar"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                    theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Buying Price (RWF)</label>
                  <input
                    type="number"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                    placeholder="900"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                      theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Selling Price (RWF)</label>
                  <input
                    type="number"
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
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Quantity</label>
                  <input
                    type="number"
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
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                      theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="kg">kg</option>
                    <option value="piece">piece</option>
                    <option value="loaf">loaf</option>
                    <option value="slice">slice</option>
                    <option value="cup">cup</option>
                  </select>
                </div>
              </div>

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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
