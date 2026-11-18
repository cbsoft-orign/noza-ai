import { useState } from 'react';
import { Store, Globe, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Settings() {
  const { shop, setShop, lang, setLang, backendStatus, theme } = useApp();
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
        <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Shop & Integration Settings</h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Configure your shop profile, language preferences, and backend connection parameters.</p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0] text-[#08D9C0] font-semibold text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>Shop settings updated successfully!</span>
        </div>
      )}

      <div className={`border rounded-3xl p-8 space-y-6 shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center gap-3 pb-4 border-b ${theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'}`}>
          <Store className="w-5 h-5 text-[#08D9C0]" />
          <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Shop Profile</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Shop Name (Iduka)</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                  theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Village / Market</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                  theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Nyabugogo">Nyabugogo Market</option>
                <option value="Kicukiro">Kicukiro Centre</option>
                <option value="Kimironko">Kimironko Market</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>WhatsApp Phone Number</label>
            <input
              type="text"
              value={shop.phone}
              disabled
              className={`w-full rounded-xl px-4 py-3 text-sm border cursor-not-allowed ${
                theme === 'dark' ? 'bg-[#07090A]/50 border-[#202829] text-[#747E80]' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            />
          </div>

          <div className="flex items-center justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-sm hover:opacity-95 transition shadow-lg shadow-[#08D9C0]/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Integration & Language Settings */}
      <div className={`border rounded-3xl p-8 space-y-6 shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center gap-3 pb-4 border-b ${theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'}`}>
          <Globe className="w-5 h-5 text-[#08D9C0]" />
          <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Language & Backend Integrations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Default Interface Language</label>
            <div className="flex gap-3">
              <button
                onClick={() => setLang('en')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border transition ${lang === 'en' ? 'bg-[#08D9C0] text-black border-[#08D9C0]' : theme === 'dark' ? 'bg-[#07090A] text-white border-[#202829]' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
              >
                English
              </button>
              <button
                onClick={() => setLang('rw')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border transition ${lang === 'rw' ? 'bg-[#08D9C0] text-black border-[#08D9C0]' : theme === 'dark' ? 'bg-[#07090A] text-white border-[#202829]' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
              >
                Kinyarwanda
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Backend Status</label>
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-[#B4BABB]' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <span>Next.js API Proxy</span>
              <span className="text-[#08D9C0] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#08D9C0] animate-pulse" /> {backendStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
