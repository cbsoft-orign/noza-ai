import { Rocket, Package, ShoppingCart, FileText, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: 'Add Product', icon: Package, path: '/products', color: 'from-[#087e73] to-[#08d9c0]' },
    { label: 'Record Sale (POS)', icon: ShoppingCart, path: '/pos', color: 'from-[#087e73]/80 to-[#08d9c0]/80' },
    { label: 'View Reports', icon: FileText, path: '/reports', color: 'from-[#111516] to-[#0c1112]', border: true },
    { label: 'Voice & AI Assistant', icon: Bot, path: '/pos', color: 'from-[#087e73] to-[#08d9c0]' },
  ];

  return (
    <div className="bg-[#111516] border border-[#202829] rounded-2xl p-6 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/30 flex items-center justify-center text-[#08d9c0]">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Quick Actions</h3>
          <p className="text-xs text-[#a5acad]">Shortcuts for daily operations</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((act) => {
          const IconC = act.icon;
          return (
            <button
              key={act.label}
              onClick={() => navigate(act.path)}
              className={`p-4 rounded-xl flex flex-col items-start justify-between gap-3 bg-gradient-to-br ${act.color} text-black font-semibold hover:opacity-95 transition shadow-lg text-left group`}
            >
              <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-white">
                <IconC className="w-4 h-4 group-hover:scale-110 transition" />
              </div>
              <span className="text-sm font-bold text-white tracking-wide">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
