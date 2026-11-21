import { useState } from 'react';
import { Users, UserPlus, Phone, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/useApp';
import { getTranslations } from '../data/translations';

export default function Team() {
  const { user, shop, theme, lang } = useApp();
  const t = getTranslations(lang);
  const dark = theme === 'dark';
  const [workers, setWorkers] = useState([
    { id: 1, name: 'Jean Bosco', phone: '250788111222', role: 'worker', salesToday: 145000 },
    { id: 2, name: 'Marie Uwase', phone: '250788333444', role: 'worker', salesToday: 98000 },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!workerName.trim() || !workerPhone.trim()) return;
    setWorkers((prev) => [
      ...prev,
      { id: Date.now(), name: workerName.trim(), phone: workerPhone.trim(), role: 'worker', salesToday: 0 },
    ]);
    const addedName = workerName;
    setWorkerName('');
    setWorkerPhone('');
    setIsModalOpen(false);
    setSuccessToast(lang === 'rw' ? `${addedName} yongerewe mu bakozi neza!` : `${addedName} added to the team!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.team.title}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
            {t.team.subtitle(shop.name)}
          </p>
        </div>
        {user.role === 'owner' && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs sm:text-sm hover:opacity-95 transition-all shadow-lg shadow-[#08D9C0]/20 flex items-center justify-center gap-2 active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.team.addWorker}</span>
          </button>
        )}
      </div>

      {successToast && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0] text-[#08D9C0] font-semibold text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn shadow-lg shadow-[#08D9C0]/10"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Authorized Personnel List */}
      <div
        className={`border rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm transition-colors ${
          dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`p-4 sm:p-6 border-b flex items-center gap-3 ${
            dark ? 'border-[#202829]' : 'border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#087E73]/20 text-[#08D9C0] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h3 className={`font-bold text-sm sm:text-base ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.team.authorizedPersonnel}
          </h3>
        </div>

        <div className={`divide-y ${dark ? 'divide-[#202829]' : 'divide-slate-100'}`}>
          {/* Shop Owner Tile */}
          <div
            className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
              dark ? 'hover:bg-[#07090A]/50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#087E73]/20 border border-[#08D9C0]/40 flex items-center justify-center text-[#08D9C0] font-bold text-base shrink-0">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className={`font-bold text-sm sm:text-base ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {user.name} ({t.common.you})
                </p>
                <a
                  href={`tel:${shop.phone}`}
                  className={`text-xs flex items-center gap-1.5 mt-0.5 hover:underline ${
                    dark ? 'text-[#B4BABB]' : 'text-slate-500'
                  }`}
                >
                  <Phone className="w-3 h-3 text-[#08D9C0]" /> {shop.phone}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full bg-[#08D9C0]/10 border border-[#08D9C0]/30 text-xs font-bold text-[#08D9C0] uppercase">
                {t.team.shopOwnerBadge}
              </span>
            </div>
          </div>

          {/* Worker Tiles */}
          {workers.map((w) => (
            <div
              key={w.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                dark ? 'hover:bg-[#07090A]/50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center font-bold text-base shrink-0 ${
                    dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  {w.name.charAt(0)}
                </div>
                <div>
                  <p className={`font-bold text-sm sm:text-base ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {w.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <a
                      href={`tel:${w.phone}`}
                      className={`text-xs flex items-center gap-1.5 hover:underline ${
                        dark ? 'text-[#08D9C0]' : 'text-[#087E73]'
                      }`}
                    >
                      <Phone className="w-3 h-3" /> {w.phone}
                    </a>
                    <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                      • {t.team.salesToday} <strong className={dark ? 'text-white' : 'text-slate-900'}>RWF {w.salesToday.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <a
                  href={`tel:${w.phone}`}
                  className={`p-2 rounded-xl border text-xs font-semibold sm:hidden flex items-center gap-1 ${
                    dark ? 'border-[#202829] text-slate-300' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
                <span
                  className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase ${
                    dark ? 'bg-[#747E80]/10 border-[#747E80]/30 text-[#B4BABB]' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {t.team.workerBadge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Worker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            className={`border rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl ${
              dark ? 'bg-[#101516] border-[#202829] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold">{t.team.modalTitle}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`p-1.5 rounded-lg ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                  {t.team.workerNameLabel}
                </label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="Jean Bosco"
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                    dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${dark ? 'text-[#B4BABB]' : 'text-slate-600'}`}>
                  {t.team.workerPhoneLabel}
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  placeholder="250788111222"
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0] transition ${
                    dark ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
                <p className={`text-[11px] mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Format: 25078... or 078... (WhatsApp enabled)
                </p>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${dark ? 'border-[#202829]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    dark ? 'bg-[#07090A] text-[#B4BABB] hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-xs sm:text-sm hover:opacity-95 shadow-md active:scale-95 transition-transform"
                >
                  {t.team.saveWorker}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
