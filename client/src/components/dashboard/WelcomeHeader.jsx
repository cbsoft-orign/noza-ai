import { useApp } from '../../context/useApp';

export default function WelcomeHeader() {
  const { lang, user, shop, theme } = useApp();

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className={`text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {lang === 'rw' ? 'Muraho neza,' : 'Welcome back,'}{' '}
          <span className="text-[#08D9C0]">{user.name}!</span>
        </h2>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
          {lang === 'rw'
            ? `Ucunga iduka ${shop.name} i ${shop.village}. Genzura stock n'inyungu zawe.`
            : `Manage your stock in ${shop.name} (${shop.village}), track profit, and grow your retail business.`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{lang === 'rw' ? 'Ubwoko bw\'Iduka:' : 'Plan:'}</span>
          <span className="text-xs font-bold uppercase text-[#08D9C0]">{shop.plan} Plan</span>
        </div>
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>{lang === 'rw' ? 'Credits:' : 'Credits:'}</span>
          <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{shop.credits} left</span>
        </div>
      </div>
    </div>
  );
}
