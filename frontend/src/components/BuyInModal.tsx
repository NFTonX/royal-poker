import React, { useState, useEffect } from 'react';
import { TableState } from '../types';
import { ChipStack } from './ChipStack';
import { haptic } from '../utils/telegram';
import { X, ArrowRight, ShoppingCart, Sparkles, Loader2 } from 'lucide-react';

interface BuyInModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableState: TableState;
  userChips: number;
  userTonBalance?: number;
  selectedSeat: number | null;
  onConfirmJoin: (seatIndex: number, buyIn: number) => void;
  onOpenShop: () => void;
  onOpenTonWallet?: () => void;
  isJoining?: boolean;
}

export const BuyInModal: React.FC<BuyInModalProps> = ({
  isOpen,
  onClose,
  tableState,
  userChips,
  userTonBalance = 0,
  selectedSeat,
  onConfirmJoin,
  onOpenShop,
  onOpenTonWallet,
  isJoining = false
}) => {
  if (!isOpen) return null;

  const isTon = tableState.currency === 'TON';
  const currentBalance = isTon ? userTonBalance : userChips;
  const minBuyIn = tableState.minBuyIn;
  const maxBuyIn = tableState.maxBuyIn;
  const canAfford = currentBalance >= minBuyIn;

  // Maximum chips or TON the player can actually bring based on their wallet and table cap
  const maxAvailable = Math.min(maxBuyIn, currentBalance);

  const [buyInAmount, setBuyInAmount] = useState<number>(minBuyIn);

  useEffect(() => {
    if (canAfford) {
      if (isTon) {
        setBuyInAmount(minBuyIn);
      } else {
        setBuyInAmount(Math.min(maxAvailable, Math.max(minBuyIn, minBuyIn * 2)));
      }
    }
  }, [minBuyIn, maxAvailable, canAfford, isTon]);

  // Target seat to occupy
  const targetSeat = selectedSeat !== null ? selectedSeat : tableState.seats.findIndex(s => s === null);

  const handlePreset = (fraction: 'min' | 0.5 | 'max') => {
    haptic.light();
    if (fraction === 'min') {
      setBuyInAmount(minBuyIn);
    } else if (fraction === 'max') {
      setBuyInAmount(maxAvailable);
    } else {
      const mid = Math.round((minBuyIn + maxAvailable) / 2);
      setBuyInAmount(mid);
    }
  };

  const handleConfirm = () => {
    if (targetSeat === -1) {
      haptic.error();
      return;
    }
    haptic.heavy();
    onConfirmJoin(targetSeat, buyInAmount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#07090e] border border-amber-500/30 p-5 shadow-[0_15px_50px_rgba(0,0,0,0.9)] flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5 font-['Cinzel']">
              <span>Бай-ин за стол</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <span className="text-xs text-slate-400">
              {tableState.name} • Блайнды ${tableState.smallBlind}/${tableState.bigBlind}
            </span>
          </div>

          <button
            onClick={onClose}
            disabled={isJoining}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seat Info */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400">Выбранное место:</span>
          <span className="font-bold text-amber-400">
            {targetSeat !== -1 ? `Место #${targetSeat + 1}` : 'Свободных мест нет'}
          </span>
        </div>

        {/* Balance & BuyIn Limits */}
        <div className="glass-card rounded-2xl p-3.5 flex flex-col gap-2 border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Ваш баланс:</span>
            <span className="font-mono font-bold text-slate-100">
              {isTon ? `💎 ${userTonBalance.toFixed(2)} TON` : `$${userChips.toLocaleString()}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Лимиты стола:</span>
            <span className="font-mono text-slate-300">
              {isTon ? `${minBuyIn} — ${maxBuyIn} TON` : `$${minBuyIn.toLocaleString()} — $${maxBuyIn.toLocaleString()}`}
            </span>
          </div>
        </div>

        {canAfford ? (
          <div className="flex flex-col gap-3">
            {/* Amount Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Сумма стека:</span>
                <span className={`font-mono font-black text-lg ${isTon ? 'text-cyan-300' : 'text-amber-300'}`}>
                  {isTon ? `${buyInAmount} TON` : `$${buyInAmount.toLocaleString()}`}
                </span>
              </div>

              <input
                type="range"
                min={minBuyIn}
                max={maxAvailable}
                step={isTon ? 0.5 : tableState.bigBlind}
                value={buyInAmount}
                onChange={(e) => setBuyInAmount(parseFloat(e.target.value))}
                className="w-full poker-slider cursor-pointer accent-amber-500"
              />

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handlePreset('min')}
                  className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition-all border border-slate-700"
                >
                  Мин ({isTon ? `${minBuyIn} TON` : `$${minBuyIn.toLocaleString()}`})
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(0.5)}
                  className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition-all border border-slate-700"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('max')}
                  className={`py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs active:scale-95 transition-all border ${
                    isTon ? 'text-cyan-300 border-cyan-500/40' : 'text-amber-300 border-amber-500/40'
                  }`}
                >
                  Макс ({isTon ? `${maxAvailable} TON` : `$${maxAvailable.toLocaleString()}`})
                </button>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={isJoining || targetSeat === -1}
              className={`w-full py-3 rounded-2xl active:scale-95 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                isTon
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 shadow-cyan-950/40'
                  : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 border border-emerald-400/40 shadow-emerald-950/40'
              }`}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Посадка за стол...</span>
                </>
              ) : (
                <>
                  <span>Сесть за стол с {isTon ? `${buyInAmount} TON` : `$${buyInAmount.toLocaleString()}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Not enough balance state */
          <div className="flex flex-col gap-3 py-1">
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-center flex flex-col gap-1">
              <span className="text-xs font-bold text-rose-300">
                {isTon ? 'Недостаточно TON для игры' : 'Недостаточно фишек для игры'}
              </span>
              <span className="text-[11px] text-rose-200/80">
                {isTon
                  ? `Минимальный бай-ин: ${minBuyIn} TON. У вас: ${userTonBalance.toFixed(2)} TON.`
                  : `Минимальный бай-ин: $${minBuyIn.toLocaleString()}. У вас: $${userChips.toLocaleString()}.`}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                if (isTon && onOpenTonWallet) {
                  onOpenTonWallet();
                } else {
                  onOpenShop();
                }
              }}
              className={`w-full py-3 rounded-2xl active:scale-95 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                isTon
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-300'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isTon ? 'Пополнить баланс TON 💎' : 'Пополнить фишки в Магазине ⭐️'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
