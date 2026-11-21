import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, FileText, Menu } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function MobileBottomNav({ onOpenMenu }) {
  const { lang, theme } = useApp();
  const dark = theme === 'dark';

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: lang === 'rw' ? 'Ikibaho' : 'Dashboard',
    },
    {
      to: '/products',
      icon: Package,
      label: lang === 'rw' ? 'Ibikoresho' : 'Products',
    },
    {
      to: '/pos',
      icon: ShoppingCart,
      label: lang === 'rw' ? 'Gurisha' : 'POS',
      isPrimary: true,
    },
    {
      to: '/reports',
      icon: FileText,
      label: lang === 'rw' ? 'Raporo' : 'Reports',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t pb-[env(safe-area-inset-bottom)] transition-colors ${
        dark
          ? 'bg-[#07090A]/95 border-[#202829] text-slate-400'
          : 'bg-white/95 border-slate-200 text-slate-500'
      } backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]`}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center relative -top-3.5 transition-transform active:scale-95 group"
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-tr from-[#087E73] to-[#08D9C0] text-black shadow-[#08D9C0]/40 ring-2 ring-[#08D9C0]'
                          : 'bg-gradient-to-tr from-[#087E73] to-[#08D9C0] text-black shadow-[#08D9C0]/25 hover:brightness-110'
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span
                      className={`text-[10px] font-bold mt-1 ${
                        isActive
                          ? dark ? 'text-[#08D9C0]' : 'text-[#087E73]'
                          : dark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all active:scale-95 ${
                  isActive
                    ? dark
                      ? 'text-[#08D9C0] font-bold'
                      : 'text-[#087E73] font-bold'
                    : dark
                    ? 'hover:text-slate-200'
                    : 'hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'
                    }`}
                  />
                  <span className="text-[10px] tracking-tight mt-1 truncate max-w-full">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#08D9C0] mt-0.5" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Menu toggle for Team, Billing, Settings, Voice Assistant */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={lang === 'rw' ? 'Ibindi' : 'More Menu'}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all active:scale-95 ${
            dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] tracking-tight mt-1">
            {lang === 'rw' ? 'Ibindi' : 'More'}
          </span>
        </button>
      </div>
    </nav>
  );
}
