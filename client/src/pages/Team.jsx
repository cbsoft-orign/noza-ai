import { useState } from 'react';
import { Users, UserPlus, Phone } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Team() {
  const { user, shop } = useApp();
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
          <h2 className="text-3xl font-extrabold text-white">Team & Worker Management</h2>
          <p className="text-sm text-[#a5acad] mt-1">Manage employee permissions and view sales attribution for {shop.name}.</p>
        </div>
        {user.role === 'owner' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#087e73] to-[#08d9c0] text-black font-bold text-sm hover:opacity-95 transition shadow-lg shadow-[#08d9c0]/20 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Shop Worker</span>
          </button>
        )}
      </div>

      <div className="bg-[#111516] border border-[#202829] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#202829] flex items-center gap-3">
          <Users className="w-5 h-5 text-[#08d9c0]" />
          <h3 className="font-bold text-white text-base">Authorized Personnel</h3>
        </div>

        <div className="divide-y divide-[#202829]">
          <div className="p-5 flex items-center justify-between hover:bg-[#07090a]/50 transition">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#087e73]/20 border border-[#08d9c0]/40 flex items-center justify-center text-[#08d9c0] font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white">{user.name} (You)</p>
                <p className="text-xs text-[#a5acad] flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-[#08d9c0]" /> {shop.phone}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#08d9c0]/10 border border-[#08d9c0]/30 text-xs font-bold text-[#08d9c0] uppercase">
              Shop Owner
            </span>
          </div>

          {workers.map((w) => (
            <div key={w.id} className="p-5 flex items-center justify-between hover:bg-[#07090a]/50 transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#111516] border border-[#202829] flex items-center justify-center text-white font-bold">
                  {w.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white">{w.name}</p>
                  <p className="text-xs text-[#a5acad] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-[#08d9c0]" /> {w.phone} • Sales Today: RWF {w.salesToday.toLocaleString()}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#747d80]/10 border border-[#747d80]/30 text-xs font-semibold text-[#a5acad] uppercase">
                Worker
              </span>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111516] border border-[#202829] rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add Worker Access</h3>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1">Worker Name</label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="Jean Bosco"
                  className="w-full bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#a5acad] uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  placeholder="250788111222"
                  className="w-full bg-[#07090a] border border-[#202829] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#08d9c0]"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#202829]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#07090a] text-sm text-[#a5acad] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#087e73] to-[#08d9c0] text-black font-bold text-sm hover:opacity-95"
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
