import { Search, Bell, Globe, Sun, Moon, Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';

export default function TopNavbar({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const { lang, setLang, theme, toggleTheme, user, backendStatus, logout } = useApp();

  const handleLogout = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  return (
    <header className={`h-[64px] ${theme === 'dark' ? 'bg-[#07090A]/90 border-[#202829]' : 'bg-white/90 border-slate-200'} backdrop-blur-md border-b px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors`}>
      {/* Left section: mobile menu toggle + search */}
      <div className="flex items-center gap-3 w-full max-w-[420px]">
        <button
          onClick={onToggleMobileSidebar}
          className={`md:hidden p-2 rounded-xl border transition ${theme === 'dark' ? 'bg-[#101516] border-[#202829] text-white' : 'bg-slate-100 border-slate-300 text-slate-800'}`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747E80]" />
          <input
            type="text"
            placeholder={lang === 'rw' ? 'Shakisha ibicuruzwa...' : 'Search products, categories...'}
            className={`w-full rounded-xl pl-10 pr-4 py-2 text-sm transition focus:outline-none ${
              theme === 'dark'
                ? 'bg-[#101516] border border-[#202829] text-white placeholder-[#747E80] focus:border-[#08D9C0]'
                : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#087E73]'
            }`}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Backend Status Pill */}
        <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-[#101516] border border-[#202829] text-[#B4BABB]' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
          <span className="w-2 h-2 rounded-full bg-[#08D9C0] animate-pulse" />
          <span className="truncate max-w-[160px]">{backendStatus}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition ${theme === 'dark' ? 'bg-[#101516] border-[#202829] text-amber-400 hover:border-[#08D9C0]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-[#087E73]'}`}
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'rw' : 'en')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
            theme === 'dark' ? 'bg-[#101516] border-[#202829] text-white hover:border-[#08D9C0]' : 'bg-slate-100 border-slate-200 text-slate-800 hover:border-[#087E73]'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-[#08D9C0]" />
          <span>{lang === 'en' ? 'RW' : 'EN'}</span>
        </button>

        {/* Notification Bell */}
        <button className={`relative p-2 rounded-xl border transition ${theme === 'dark' ? 'bg-[#101516] border-[#202829] text-[#B4BABB] hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'}`}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#08D9C0]" />
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#087E73] to-[#08D9C0] text-black font-black flex items-center justify-center text-sm shadow-md">
          {user.name.charAt(0)}
        </div>
        <button
          onClick={handleLogout}
          className={`p-2 rounded-xl border transition ${theme === 'dark' ? 'bg-[#101516] border-[#202829] text-[#B4BABB] hover:text-red-400' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-red-500'}`}
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
