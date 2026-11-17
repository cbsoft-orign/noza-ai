import { useState } from 'react';
import { Store, Globe, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Settings() {
  const { shop, setShop, lang, setLang, backendStatus } = useApp();
  const [shopName, setShopName] = useState(shop.name);
  const [village, setVillage] = useState(shop.village);
  const [success, setSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setShop((prev) => ({ ...prev, name: shopName, village }));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Shop & Integration Settings</h2>
        <p className="text-sm text-[#a5acad] mt-1">Configure your shop profile, language preferences, and backend connection parameters.</p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-[#087e73]/20 border border-[#08d9c0] text-[#08d9c0] font-semibold text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>Shop settings updated successfully!</span>
        </div>
      )}

      <div className="bg-[#111516] border border-[#202829] rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#202829]">
          <Store className="w-5 h-5 text-[#08d9c0]" />
          <h3 className="font-bold text-white text-lg">Shop Profile</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1">Shop Name (Iduka)</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1">Village / Market</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0]"
              >
                <option value="Nyabugogo">Nyabugogo Market</option>
                <option value="Kicukiro">Kicukiro Centre</option>
                <option value="Kimironko">Kimironko Market</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1">WhatsApp Phone Number</label>
            <input
              type="text"
              value={shop.phone}
              disabled
              className="w-full bg-[#07090a]/50 border border-[#202829] rounded-xl px-4 py-3 text-sm text-[#747d80] cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#087e73] to-[#08d9c0] text-black font-bold text-sm hover:opacity-95 transition shadow-lg shadow-[#08d9c0]/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Integration & Language Settings */}
      <div className="bg-[#111516] border border-[#202829] rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#202829]">
          <Globe className="w-5 h-5 text-[#08d9c0]" />
          <h3 className="font-bold text-white text-lg">Language & Backend Integrations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider">Default Interface Language</label>
            <div className="flex gap-3">
              <button
                onClick={() => setLang('en')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border transition ${lang === 'en' ? 'bg-[#08d9c0] text-black border-[#08d9c0]' : 'bg-[#07090a] text-white border-[#202829]'}`}
              >
                English
              </button>
              <button
                onClick={() => setLang('rw')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border transition ${lang === 'rw' ? 'bg-[#08d9c0] text-black border-[#08d9c0]' : 'bg-[#07090a] text-white border-[#202829]'}`}
              >
                Kinyarwanda
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider">Backend Status</label>
            <div className="p-3.5 rounded-xl bg-[#07090a] border border-[#202829] flex items-center justify-between text-xs">
              <span className="text-[#a5acad]">Next.js API Proxy</span>
              <span className="text-[#08d9c0] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#08d9c0] animate-pulse" /> {backendStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
