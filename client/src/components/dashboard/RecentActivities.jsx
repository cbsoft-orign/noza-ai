import { Zap, Package, User, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function RecentActivities() {
  const { activities, theme } = useApp();

  return (
    <div
      className={`border rounded-2xl p-6 flex flex-col justify-between shadow-sm ${
        theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Recent Activities</h3>
          <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Live shop event log</p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.slice(0, 4).map((act, idx) => (
          <div
            key={act.id || idx}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              theme === 'dark' ? 'bg-[#07090A] border-[#202829]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[#08D9C0] ${
                  theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
                }`}
              >
                {act.type === 'sale' ? <ShoppingCart className="w-4 h-4" /> : act.type === 'customer' ? <User className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              </div>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{act.text}</p>
            </div>
            <span className={`text-xs ${theme === 'dark' ? 'text-[#747E80]' : 'text-slate-400'} shrink-0`}>{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
