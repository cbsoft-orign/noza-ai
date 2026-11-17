import { User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';

export default function UserProfile() {
  const { user, shop } = useApp();
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/settings')}
      className="p-2.5 rounded-2xl bg-[#101516] border border-[#202829] flex items-center justify-between hover:border-[#08D9C0]/50 transition cursor-pointer"
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-9 h-9 rounded-full bg-[#07090A] border border-[#08D9C0]/60 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(8,217,192,0.2)]">
          <User className="w-4 h-4 text-[#08D9C0]" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-[10px] text-[#747E80] truncate uppercase tracking-wider">Admin • {shop.name}</p>
        </div>
      </div>
      <ChevronDown className="w-4 h-4 text-[#747E80]" />
    </div>
  );
}
