import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, CreditCard, Settings, X } from 'lucide-react';
import { useApp } from '../../context/useApp';
import Logo from '../sidebar/Logo';
import VoiceAssistant from '../sidebar/VoiceAssistant';
import UserProfile from '../sidebar/UserProfile';

const iconMap = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  CreditCard,
  Settings,
};

export default function Sidebar({ navigationItems, mobileOpen, onCloseMobile }) {
  const { lang, theme } = useApp();
  const dark = theme === 'dark';

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {/* Mobile Backdrop with smooth fade */}
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        aria-label="Sidebar Navigation"
        className={`w-[280px] max-w-[85vw] md:w-56 lg:w-60 md:min-w-[14rem] lg:min-w-[15rem] h-screen ${
          dark
            ? 'bg-[#050909] border-[#202829] text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl md:shadow-none'
        } border-r flex flex-col justify-between select-none fixed left-0 top-0 z-50 overflow-hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Close button for mobile with large touch target */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label={lang === 'rw' ? 'Funga' : 'Close menu'}
          className={`absolute top-4 right-4 md:hidden p-2 rounded-xl transition ${
            dark
              ? 'text-slate-400 hover:text-white hover:bg-white/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {dark && (
          <>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#08D9C0]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#087E73]/15 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        <div className="relative z-10 flex flex-col h-full">
          <div className="pr-12 md:pr-0">
            <Logo />
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 mt-2 flex-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const IconComponent = iconMap[item.icon] || LayoutDashboard;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 sm:py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                      isActive
                        ? 'bg-gradient-to-r from-[#08D9C0] to-[#087E73] text-black font-bold shadow-[0_0_20px_rgba(8,217,192,0.3)]'
                        : dark
                        ? 'text-[#B4BABB] hover:text-white hover:bg-[#101516]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <IconComponent className="w-5 h-5 shrink-0" />
                  <span className="truncate">{lang === 'rw' ? item.labelRw : item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Section: Voice Assistant & User Profile */}
          <div
            className={`p-3 border-t ${
              dark
                ? 'border-[#202829] bg-[#07090A]/95'
                : 'border-slate-200 bg-slate-50/95'
            } backdrop-blur-md relative z-10 space-y-3 pb-safe`}
          >
            <VoiceAssistant onNavigate={onCloseMobile} />
            <UserProfile />
          </div>
        </div>
      </aside>
    </>
  );
}
