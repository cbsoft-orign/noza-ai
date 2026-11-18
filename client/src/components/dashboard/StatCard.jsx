import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/useApp';

const iconMap = {
  Package,
  ShoppingCart,
  Users,
};

export default function StatCard({ title, value, growth, icon, subtitle }) {
  const { theme } = useApp();
  const IconC = iconMap[icon] || Package;

  return (
    <div
      className={`border rounded-2xl p-6 flex flex-col justify-between transition group shadow-sm ${
        theme === 'dark'
          ? 'bg-[#101516] border-[#202829] hover:border-[#08D9C0]/50'
          : 'bg-white border-slate-200 hover:border-[#087E73]/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{title}</span>
        <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0] group-hover:scale-105 transition">
          <IconC className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#08D9C0] bg-[#08D9C0]/10 px-2 py-0.5 rounded-md">
            <TrendingUp className="w-3.5 h-3.5" /> {growth}
          </span>
          <span className={`text-xs ${theme === 'dark' ? 'text-[#747E80]' : 'text-slate-400'}`}>{subtitle}</span>
        </div>
      </div>
    </div>
  );
}
