import React, { useState, useEffect } from 'react';
import { LuckyWheelPrize } from '../types';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpin: () => void;
  lastSpinTime?: number;
  spinResult?: { success: boolean; prize?: LuckyWheelPrize; nextSpinIn: number; message: string } | null;
}

const SECTORS = [
  { label: '500 🪙', color: '#1e293b', textColor: '#94a3b8' },
  { label: '1,000 🪙', color: '#0f766e', textColor: '#5eead4' },
  { label: '2,500 🪙', color: '#1d4ed8', textColor: '#93c5fd' },
  { label: '5,000 🪙', color: '#7e22ce', textColor: '#d8b4fe' },
  { label: '10,000 🪙', color: '#b45309', textColor: '#fde68a' },
  { label: '0.05 💎', color: '#0369a1', textColor: '#38bdf8' },
  { label: '0.1 💎', color: '#0284c7', textColor: '#7dd3fc' },
  { label: '0.5 💎🔥', color: '#dc2626', textColor: '#fef08a' }
];

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  onSpin,
  lastSpinTime = 0,
  spinResult
}) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [canSpin, setCanSpin] = useState(false);
  const [showPrize, setShowPrize] = useState<LuckyWheelPrize | null>(null);

  const COOLDOWN = 24 * 60 * 60 * 1000;

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const timeSince = now - lastSpinTime;
      if (timeSince >= COOLDOWN) {
        setCanSpin(true);
        setTimeLeft('');
      } else {
        setCanSpin(false);
        const rem = COOLDOWN - timeSince;
        const hours = Math.floor(rem / (60 * 60 * 1000));
        const mins = Math.floor((rem % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((rem % (60 * 1000)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastSpinTime]);

  useEffect(() => {
    if (spinResult && isSpinning) {
      if (spinResult.success && spinResult.prize) {
        // Find sector index
        let targetIndex = 0;
        if (spinResult.prize.type === 'ton') {
          if (spinResult.prize.amount >= 0.5) targetIndex = 7;
          else if (spinResult.prize.amount >= 0.1) targetIndex = 6;
          else targetIndex = 5;
        } else {
          if (spinResult.prize.amount >= 10000) targetIndex = 4;
          else if (spinResult.prize.amount >= 5000) targetIndex = 3;
          else if (spinResult.prize.amount >= 2500) targetIndex = 2;
          else if (spinResult.prize.amount >= 1000) targetIndex = 1;
          else targetIndex = 0;
        }

        const sectorDegree = 360 / SECTORS.length;
        // Total rotations: 5 full turns (1800 deg) + sector alignment
        const targetDegree = 360 * 5 + (360 - (targetIndex * sectorDegree + sectorDegree / 2));
        setRotation(targetDegree);

        const timer = setTimeout(() => {
          setIsSpinning(false);
          setShowPrize(spinResult.prize || null);
        }, 4500);

        return () => clearTimeout(timer);
      } else {
        setIsSpinning(false);
      }
    }
  }, [spinResult]);

  if (!isOpen) return null;

  const handleStartSpin = () => {
    if (!canSpin || isSpinning) return;
    setIsSpinning(true);
    setShowPrize(null);
    onSpin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#151c28] to-[#0d121c] border border-amber-500/30 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm transition"
        >
          ✕
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🎡</span>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 font-['Cinzel'] tracking-wide">
            Колесо Фортуны
          </h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">Крутите каждый день и выигрывайте фишки и TON!</p>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 my-2 flex items-center justify-center">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]" />

          {/* Wheel Graphic */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.3)] relative overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none'
            }}
          >
            {SECTORS.map((sec, idx) => {
              const angle = (360 / SECTORS.length) * idx;
              return (
                <div
                  key={idx}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: 'polygon(50% 50%, 30% 0%, 70% 0%)',
                    backgroundColor: sec.color
                  }}
                >
                  <div
                    className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-tight whitespace-nowrap"
                    style={{ color: sec.textColor }}
                  >
                    {sec.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Hub */}
          <div className="absolute z-10 w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 border-2 border-yellow-100 shadow-xl flex items-center justify-center text-xl font-black text-black">
            🎰
          </div>
        </div>

        {/* Prize Notification Modal */}
        {showPrize && (
          <div className="w-full mt-3 p-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 rounded-2xl animate-bounce">
            <div className="text-xs text-amber-300 font-semibold">Ваш выигрыш:</div>
            <div className="text-lg font-black text-white drop-shadow">{showPrize.label}</div>
          </div>
        )}

        {/* Action Button */}
        <div className="w-full mt-4">
          {canSpin ? (
            <button
              onClick={handleStartSpin}
              disabled={isSpinning}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition disabled:opacity-50"
            >
              {isSpinning ? 'Колесо крутится...' : 'Крутить Бесплатно! 🚀'}
            </button>
          ) : (
            <div className="w-full py-3 px-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
              <span className="text-xs text-gray-400">Следующий бесплатный спин через:</span>
              <span className="text-base font-black text-amber-400 font-mono mt-0.5">{timeLeft}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
