import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';

const iconMap = {
  Package,
  ShoppingCart,
  Users,
};

export default function StatCard({ title, value, growth, icon, subtitle }) {
  const IconC = iconMap[icon] || Package;

  return (
    <div className="bg-[#111516] border border-[#202829] rounded-2xl p-6 flex flex-col justify-between hover:border-[#08d9c0]/50 transition group">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#a5acad]">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/30 flex items-center justify-center text-[#08d9c0] group-hover:scale-105 transition">
          <IconC className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#08d9c0] bg-[#08d9c0]/10 px-2 py-0.5 rounded-md">
            <TrendingUp className="w-3.5 h-3.5" /> {growth}
          </span>
          <span className="text-xs text-[#747d80]">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}
