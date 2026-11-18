import { Rocket, Package, ShoppingCart, FileText, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';

export default function QuickActions() {
  const navigate = useNavigate();
  const { theme } = useApp();

  const actions = [
    { label: 'Add Product', icon: Package, path: '/products', color: 'from-[#087E73] to-[#08D9C0]' },
    { label: 'Record Sale (POS)', icon: ShoppingCart, path: '/pos', color: 'from-[#087E73]/80 to-[#08D9C0]/80' },
    { label: 'View Reports', icon: FileText, path: '/reports', color: theme === 'dark' ? 'from-[#101516] to-[#0C1112]' : 'from-slate-100 to-slate-200 text-slate-900', border: true },
    { label: 'Voice & AI Assistant', icon: Bot, path: '/pos', color: 'from-[#087E73] to-[#08D9C0]' },
  ];

  return (
    <div
      className={`border rounded-2xl p-6 flex flex-col justify-between shadow-sm ${
        theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/30 flex items-center justify-center text-[#08D9C0]">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h3>
          <p className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>Shortcuts for daily operations</p>
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
              <span className={`text-sm font-bold tracking-wide ${act.border && theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
