import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import VoiceAIModal from '../common/VoiceAIModal';

export default function VoiceAssistant() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="p-3 rounded-2xl bg-[#101516] border border-[#08D9C0]/40 shadow-[0_0_15px_rgba(8,217,192,0.15)] flex items-center justify-between cursor-pointer hover:border-[#08D9C0] hover:bg-[#142020] transition group"
      >
        <div className="flex items-center gap-2.5">
          {/* Audio waveform icon */}
          <div className="flex items-end gap-0.5 h-5 w-6 py-0.5">
            <span className="w-1 bg-[#08D9C0] h-2 rounded-full animate-pulse" />
            <span className="w-1 bg-[#08D9C0] h-5 rounded-full animate-pulse delay-75" />
            <span className="w-1 bg-[#08D9C0] h-3 rounded-full animate-pulse delay-150" />
            <span className="w-1 bg-[#08D9C0] h-4 rounded-full animate-pulse delay-200" />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-wide">Voice Assistant</p>
            <p className="text-[10px] text-[#B4BABB]">Ask or command...</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#08D9C0] group-hover:translate-x-0.5 transition" />
      </div>

      <VoiceAIModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
