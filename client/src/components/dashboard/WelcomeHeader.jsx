import { useApp } from '../../context/useApp';

export default function WelcomeHeader() {
  const { lang, user, shop } = useApp();

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          {lang === 'rw' ? 'Muraho neza,' : 'Welcome back,'}{' '}
          <span className="text-[#08d9c0]">{user.name}!</span>
        </h2>
        <p className="text-sm text-[#a5acad] mt-1">
          {lang === 'rw'
            ? `Ucunga iduka ${shop.name} i ${shop.village}. Genzura stock n'inyungu zawe.`
            : `Manage your stock in ${shop.name} (${shop.village}), track profit, and grow your retail business.`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-xl bg-[#111516] border border-[#202829] flex items-center gap-2">
          <span className="text-xs text-[#a5acad]">{lang === 'rw' ? 'Ubwoko bw\'Iduka:' : 'Plan:'}</span>
          <span className="text-xs font-bold uppercase text-[#08d9c0]">{shop.plan} Plan</span>
        </div>
        <div className="px-4 py-2 rounded-xl bg-[#111516] border border-[#202829] flex items-center gap-2">
          <span className="text-xs text-[#a5acad]">{lang === 'rw' ? 'Credits:' : 'Credits:'}</span>
          <span className="text-xs font-bold text-white">{shop.credits} left</span>
        </div>
      </div>
    </div>
  );
}
