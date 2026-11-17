import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, CreditCard, Settings } from 'lucide-react';
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

export default function Sidebar({ navigationItems }) {
  const { lang } = useApp();

  return (
    <aside className="w-[195px] min-w-[195px] h-screen bg-[#050909] border-r border-[#202829] flex flex-col justify-between select-none fixed left-0 top-0 z-30 overflow-hidden">
      {/* Decorative background turquoise glow & waves */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#08D9C0]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#087E73]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        <Logo />

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5 mt-3 flex-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const IconComponent = iconMap[item.icon] || LayoutDashboard;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-r-2xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#08D9C0] to-[#087E73] text-black font-bold shadow-[0_0_20px_rgba(8,217,192,0.3)]'
                      : 'text-[#B4BABB] hover:text-white hover:bg-[#101516]'
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
        <div className="p-3 border-t border-[#202829] space-y-3 bg-[#07090A]/90 backdrop-blur-md relative z-10">
          <VoiceAssistant />
          <UserProfile />
        </div>
      </div>
    </aside>
  );
}
