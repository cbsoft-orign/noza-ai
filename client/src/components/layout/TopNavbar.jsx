import { Search, Bell, Globe } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function TopNavbar() {
  const { lang, setLang, user, backendStatus } = useApp();

  return (
    <header className="h-[64px] bg-[#07090a]/90 backdrop-blur-md border-b border-[#202829] px-6 flex items-center justify-between sticky top-0 z-20 ml-[200px]">
      {/* Search Input */}
      <div className="flex items-center gap-4 w-[380px]">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747d80]" />
          <input
            type="text"
            placeholder={lang === 'rw' ? 'Shakisha ibicuruzwa...' : 'Search products, categories...'}
            className="w-full bg-[#111516] border border-[#202829] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-[#747d80] focus:outline-none focus:border-[#08d9c0] transition"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Backend / Health Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111516] border border-[#202829] text-xs text-[#a5acad]">
          <span className="w-2 h-2 rounded-full bg-[#08d9c0] animate-pulse" />
          <span className="truncate max-w-[180px]">{backendStatus}</span>
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'rw' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111516] border border-[#202829] text-xs font-semibold text-white hover:border-[#08d9c0] transition"
        >
          <Globe className="w-3.5 h-3.5 text-[#08d9c0]" />
          <span>{lang === 'en' ? 'RW' : 'EN'}</span>
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl bg-[#111516] border border-[#202829] text-[#a5acad] hover:text-white hover:border-[#08d9c0] transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#08d9c0]" />
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#087e73] to-[#08d9c0] text-black font-black flex items-center justify-center text-sm shadow-md">
          {user.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}
