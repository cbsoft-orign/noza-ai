import logoImg from '../../assets/nozalogo_b2dda888.png';

export default function Logo() {
  return (
    <div className="p-4 flex flex-col items-center text-center border-b border-[#202829] relative z-10 bg-[#050909]">
      <div className="w-full flex items-center justify-center mb-1">
        <img src={logoImg} alt="NOZA Logo" className="w-full max-h-[55px] object-contain drop-shadow-[0_0_12px_rgba(8,217,192,0.4)]" />
      </div>
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#08D9C0] to-transparent mt-3 opacity-60" />
    </div>
  );
}
