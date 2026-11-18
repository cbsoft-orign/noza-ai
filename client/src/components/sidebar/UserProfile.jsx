import { User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';

export default function UserProfile() {
  const { user, shop, theme } = useApp();
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/settings')}
      className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-sm ${
        theme === 'dark'
          ? 'bg-[#101516] border-[#202829] hover:border-[#08D9C0]/50 text-white'
          : 'bg-white border-slate-200 hover:border-[#087E73]/50 text-slate-900'
      }`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className={`w-9 h-9 rounded-full ${theme === 'dark' ? 'bg-[#07090A] border-[#08D9C0]/60 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'} border flex items-center justify-center shrink-0 shadow-sm`}>
          <User className="w-4 h-4 text-[#08D9C0]" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className={`text-[10px] truncate uppercase tracking-wider ${theme === 'dark' ? 'text-[#747E80]' : 'text-slate-500'}`}>Admin • {shop.name}</p>
        </div>
      </div>
      <ChevronDown className={`w-4 h-4 ${theme === 'dark' ? 'text-[#747E80]' : 'text-slate-400'}`} />
    </div>
  );
}
