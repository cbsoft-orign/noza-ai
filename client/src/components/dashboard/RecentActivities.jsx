import { Zap, Package, User, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function RecentActivities() {
  const { activities } = useApp();

  return (
    <div className="bg-[#111516] border border-[#202829] rounded-2xl p-6 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/30 flex items-center justify-center text-[#08d9c0]">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Recent Activities</h3>
          <p className="text-xs text-[#a5acad]">Live shop event log</p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.slice(0, 4).map((act, idx) => (
          <div key={act.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-[#07090a] border border-[#202829]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#111516] border border-[#202829] flex items-center justify-center text-[#08d9c0]">
                {act.type === 'sale' ? <ShoppingCart className="w-4 h-4" /> : act.type === 'customer' ? <User className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              </div>
              <p className="text-sm font-medium text-white">{act.text}</p>
            </div>
            <span className="text-xs text-[#747d80] shrink-0">{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
