import { useState } from 'react';
import { Users, UserPlus, Phone } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Team() {
  const { user, shop, theme } = useApp();
  const [workers, setWorkers] = useState([
    { id: 1, name: 'Jean Bosco', phone: '250788111222', role: 'worker', salesToday: 145000 },
    { id: 2, name: 'Marie Uwase', phone: '250788333444', role: 'worker', salesToday: 98000 },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');

  const handleAddWorker = (e) => {
    e.preventDefault();
    setWorkers((prev) => [...prev, { id: Date.now(), name: workerName, phone: workerPhone, role: 'worker', salesToday: 0 }]);
    setWorkerName('');
    setWorkerPhone('');
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Team & Worker Management</h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Manage employee permissions and view sales attribution for {shop.name}.</p>
        </div>
        {user.role === 'owner' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-sm hover:opacity-95 transition shadow-lg shadow-[#08D9C0]/20 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Shop Worker</span>
          </button>
        )}
      </div>

      <div className={`border rounded-2xl overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'}`}>
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'} flex items-center gap-3`}>
          <Users className="w-5 h-5 text-[#08D9C0]" />
          <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Authorized Personnel</h3>
        </div>

        <div className={`divide-y ${theme === 'dark' ? 'divide-[#202829]' : 'divide-slate-200'}`}>
          <div className={`p-5 flex items-center justify-between transition ${theme === 'dark' ? 'hover:bg-[#07090A]/50' : 'hover:bg-slate-50'}`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#087E73]/20 border border-[#08D9C0]/40 flex items-center justify-center text-[#08D9C0] font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user.name} (You)</p>
                <p className={`text-xs flex items-center gap-1 mt-0.5 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
                  <Phone className="w-3 h-3 text-[#08D9C0]" /> {shop.phone}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#08D9C0]/10 border border-[#08D9C0]/30 text-xs font-bold text-[#08D9C0] uppercase">
              Shop Owner
            </span>
          </div>

          {workers.map((w) => (
            <div key={w.id} className={`p-5 flex items-center justify-between transition ${theme === 'dark' ? 'hover:bg-[#07090A]/50' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold ${theme === 'dark' ? 'bg-[#101516] border-[#202829] text-white' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
                  {w.name.charAt(0)}
                </div>
                <div>
                  <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{w.name}</p>
                  <p className={`text-xs flex items-center gap-1 mt-0.5 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-500'}`}>
                    <Phone className="w-3 h-3 text-[#08D9C0]" /> {w.phone} • Sales Today: RWF {w.salesToday.toLocaleString()}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase ${theme === 'dark' ? 'bg-[#747E80]/10 border-[#747E80]/30 text-[#B4BABB]' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                Worker
              </span>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`border rounded-3xl p-6 w-full max-w-md shadow-2xl ${theme === 'dark' ? 'bg-[#101516] border-[#202829] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-xl font-bold mb-4">Add Worker Access</h3>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Worker Name</label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="Jean Bosco"
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                    theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-[#B4BABB]' : 'text-slate-600'}`}>Phone Number</label>
                <input
                  type="text"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  placeholder="250788111222"
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-[#08D9C0] ${
                    theme === 'dark' ? 'bg-[#07090A] border-[#202829] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${theme === 'dark' ? 'border-[#202829]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm ${theme === 'dark' ? 'bg-[#07090A] text-[#B4BABB] hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#087E73] to-[#08D9C0] text-black font-bold text-sm hover:opacity-95"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
