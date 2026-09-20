import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { haptic } from '../utils/telegram';

interface LeaveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isInHand: boolean;
  chipsInPlay: number;
}

export const LeaveConfirmModal: React.FC<LeaveConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isInHand,
  chipsInPlay
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xs rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#0b0e14] border border-rose-500/30 p-5 shadow-[0_15px_50px_rgba(0,0,0,0.9)] flex flex-col gap-4 text-center">
        
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-slate-100">
            Выйти из-за стола?
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isInHand ? (
              <>
                Вы находитесь в активной раздаче! Ваши карты будут сброшены (<b className="text-rose-400">Фолд</b>). Оставшийся стек (<b className="text-amber-400">${chipsInPlay.toLocaleString()}</b>) вернется на ваш баланс.
              </>
            ) : (
              <>
                Ваш текущий стек (<b className="text-amber-400">${chipsInPlay.toLocaleString()}</b>) будет возвращен на ваш игровой баланс.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => {
              haptic.medium();
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs transition-all border border-slate-700"
          >
            Остаться за столом
          </button>

          <button
            onClick={() => {
              haptic.heavy();
              onConfirm();
            }}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 active:scale-95 text-white font-bold text-xs shadow-md border border-rose-600/40 flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Покинуть стол</span>
          </button>
        </div>

      </div>
    </div>
  );
};
