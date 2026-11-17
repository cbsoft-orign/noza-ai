import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function SignUp() {
  const navigate = useNavigate();
  const { setShop, setUser } = useApp();
  const [shopName, setShopName] = useState('Rubavu Duka');
  const [ownerName, setOwnerName] = useState('Jean Paul');
  const [phone, setPhone] = useState('250789000000');
  const [village, setVillage] = useState('Nyabugogo');

  const handleSignUp = (e) => {
    e.preventDefault();
    setShop({
      id: `shop-${Date.now()}`,
      name: shopName,
      phone: phone,
      village: village,
      plan: 'free',
      credits: 20,
    });
    setUser({
      id: `user-${Date.now()}`,
      name: ownerName,
      role: 'owner',
      phone: phone,
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#07090a] text-white flex items-center justify-center p-6 selection:bg-[#08d9c0] selection:text-black">
      <div className="w-full max-w-lg bg-[#111516] border border-[#202829] rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#087e73] to-[#08d9c0] flex items-center justify-center font-black text-black text-xl">
            N
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-wider text-white">SHOP REGISTRATION</h1>
            <p className="text-xs text-[#08d9c0]">Create your retail TILL & stock manager</p>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1.5">Shop Name (Iduka)</label>
            <div className="relative">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747d80]" />
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Rubavu Duka"
                className="w-full bg-[#07090a] border border-[#202829] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#747d80] focus:outline-none focus:border-[#08d9c0] transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1.5">Owner Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747d80]" />
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Jean Paul"
                className="w-full bg-[#07090a] border border-[#202829] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#747d80] focus:outline-none focus:border-[#08d9c0] transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1.5">Phone Number (WhatsApp)</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747d80]" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="250789000000"
                className="w-full bg-[#07090a] border border-[#202829] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#747d80] focus:outline-none focus:border-[#08d9c0] transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1.5">Village / Market Area</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747d80]" />
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-[#07090a] border border-[#202829] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0] transition"
              >
                <option value="Nyabugogo">Nyabugogo Market</option>
                <option value="Kicukiro">Kicukiro Centre</option>
                <option value="Kimironko">Kimironko Market</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1112] border border-[#202829] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#08d9c0] shrink-0 mt-0.5" />
            <p className="text-xs text-[#a5acad]">
              Free Plan includes up to 10 starter products automatically imported from your village benchmark catalog.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#087e73] to-[#08d9c0] text-black font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-[#08d9c0]/20 flex items-center justify-center gap-2 mt-2"
          >
            <span>Create Shop & Import Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#a5acad]">
            Already have a shop?{' '}
            <button onClick={() => navigate('/signin')} className="text-[#08d9c0] font-semibold hover:underline">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
