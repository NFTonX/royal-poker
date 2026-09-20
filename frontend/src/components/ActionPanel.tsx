import React, { useState, useEffect, useRef } from 'react';
import { Player, TableState } from '../types';
import { haptic } from '../utils/telegram';
import { ArrowUp, Minus, Plus, Loader2 } from 'lucide-react';

interface ActionPanelProps {
  tableState: TableState;
  myPlayer: Player;
  onAction: (action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN', amount?: number) => void;
}

// Blue poker chip icon matching screenshot
const BlueChipIcon = () => (
  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white/80 flex items-center justify-center shadow-sm shrink-0">
    <div className="w-1.5 h-1.5 rounded-full border border-dashed border-white/80" />
  </div>
);

// Red cards icon for Fold button matching screenshot
const CardsIcon = () => (
  <div className="relative w-4 h-4 flex items-center justify-center">
    <div className="w-2.5 h-3.5 rounded-[2px] border border-rose-400/80 bg-rose-950/80 -rotate-12 absolute -left-0.5" />
    <div className="w-2.5 h-3.5 rounded-[2px] border border-rose-300 bg-rose-900 rotate-6 absolute left-1" />
  </div>
);

export const ActionPanel: React.FC<ActionPanelProps> = ({
  tableState,
  myPlayer,
  onAction
}) => {
  const [isPending, setIsPending] = useState<boolean>(false);
  const isMyTurn = tableState.currentTurnSeat === myPlayer.seatIndex;

  // Pre-action states when waiting
  const [autoCheckFold, setAutoCheckFold] = useState<boolean>(false);
  const [autoCheck, setAutoCheck] = useState<boolean>(false);

  // Reset pending state when turn changes or community cards change
  useEffect(() => {
    setIsPending(false);
  }, [tableState.currentTurnSeat, tableState.communityCards.length, tableState.currentBet]);

  const callDiff = Math.max(0, tableState.currentBet - myPlayer.currentBet);
  const canCheck = callDiff === 0;
  const canCall = callDiff > 0 && myPlayer.chips >= callDiff;
  const isAllInCall = callDiff > 0 && myPlayer.chips < callDiff;

  // Raise constraints
  const minRaiseSize = tableState.minRaise || tableState.bigBlind;
  const minTarget = tableState.currentBet === 0
    ? tableState.bigBlind
    : tableState.currentBet + minRaiseSize;
  const maxTarget = myPlayer.chips + myPlayer.currentBet;

  // Can raise standard amount or only all-in
  const canStandardRaise = myPlayer.chips > callDiff && maxTarget >= minTarget;
  const canAllInRaise = myPlayer.chips > callDiff && maxTarget < minTarget;
  const canRaise = canStandardRaise || canAllInRaise;

  const [raiseAmount, setRaiseAmount] = useState<number>(minTarget);

  useEffect(() => {
    if (canStandardRaise) {
      setRaiseAmount(Math.max(minTarget, Math.min(maxTarget, minTarget)));
    } else if (canAllInRaise) {
      setRaiseAmount(maxTarget);
    }
  }, [minTarget, maxTarget, canStandardRaise, canAllInRaise]);

  // Handle pre-actions when turn arrives
  const prevTurnRef = useRef<boolean>(false);
  useEffect(() => {
    if (!prevTurnRef.current && isMyTurn) {
      haptic.medium();
      if (autoCheckFold) {
        setAutoCheckFold(false);
        if (canCheck) {
          onAction('CHECK');
        } else {
          onAction('FOLD');
        }
        return;
      }
      if (autoCheck) {
        setAutoCheck(false);
        if (canCheck) {
          onAction('CHECK');
          return;
        }
      }
    }
    prevTurnRef.current = isMyTurn;
  }, [isMyTurn, autoCheckFold, autoCheck, canCheck, onAction]);

  const dispatchAction = (
    action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN',
    amount?: number
  ) => {
    if (isPending) return;
    setIsPending(true);
    onAction(action, amount);
  };

  const handleFold = () => {
    haptic.medium();
    dispatchAction('FOLD');
  };

  const handleCheckOrCall = () => {
    haptic.medium();
    if (canCheck) {
      dispatchAction('CHECK');
    } else {
      dispatchAction('CALL');
    }
  };

  const handleRaise = () => {
    haptic.heavy();
    if (raiseAmount >= maxTarget || canAllInRaise) {
      dispatchAction('ALL_IN');
    } else {
      dispatchAction(tableState.currentBet === 0 ? 'BET' : 'RAISE', raiseAmount);
    }
  };

  const handleStepMinus = () => {
    haptic.light();
    setRaiseAmount(prev => Math.max(minTarget, prev - tableState.bigBlind));
  };

  const handleStepPlus = () => {
    haptic.light();
    setRaiseAmount(prev => Math.min(maxTarget, prev + tableState.bigBlind));
  };

  const setQuickRaise = (fraction: number | 'min' | 'allin') => {
    haptic.light();
    if (fraction === 'min') {
      setRaiseAmount(Math.min(minTarget, maxTarget));
    } else if (fraction === 'allin') {
      setRaiseAmount(maxTarget);
    } else {
      const potSize = tableState.totalPot + callDiff;
      const raiseAdded = Math.round(potSize * fraction);
      const target = Math.max(minTarget, Math.min(maxTarget, tableState.currentBet + raiseAdded));
      setRaiseAmount(target);
    }
  };

  return (
    <div className="bg-[#080d17]/98 backdrop-blur-xl border-t border-white/[0.08] px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] flex flex-col gap-2 z-40 select-none shadow-[0_-12px_35px_rgba(0,0,0,0.9)]">
      
      {/* ---------------- ROW 1: 3 MAIN ACTION BUTTONS (FOLD, CALL, RAISE) ---------------- */}
      <div className="grid grid-cols-3 gap-2">
        {/* Fold Button (Crimson Background, Red Cards Icon, Text: Fold) */}
        <button
          onClick={handleFold}
          disabled={isPending || (!isMyTurn && !autoCheckFold)}
          className={`h-[56px] rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 border ${
            isMyTurn
              ? 'bg-[#3b1219] hover:bg-[#4a1720] border-rose-800/80 text-white shadow-[0_4px_15px_rgba(225,29,72,0.3)]'
              : autoCheckFold
              ? 'bg-[#3b1219] border-rose-500 text-white ring-1 ring-rose-400'
              : 'bg-[#1a0f13] border-rose-950/60 text-slate-400 opacity-60'
          }`}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <>
              <CardsIcon />
              <span className="text-sm font-bold tracking-tight mt-0.5">Fold</span>
            </>
          )}
        </button>

        {/* Call / Check Button (Emerald Green Background, Text: Call, Blue Chip + Amount) */}
        <button
          onClick={handleCheckOrCall}
          disabled={isPending || (!isMyTurn && !autoCheck)}
          className={`h-[56px] rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 border ${
            isMyTurn
              ? 'bg-[#0e7a48] hover:bg-[#108c52] border-emerald-400/60 text-white shadow-[0_0_18px_rgba(16,185,129,0.35)]'
              : autoCheck
              ? 'bg-[#0e7a48] border-emerald-400 text-white ring-1 ring-emerald-400'
              : 'bg-[#082216] border-emerald-950/60 text-slate-400 opacity-60'
          }`}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <>
              <span className="text-sm font-bold tracking-tight leading-tight">
                {canCheck ? 'Check' : 'Call'}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <BlueChipIcon />
                <span className="text-xs font-black font-mono leading-tight">
                  {canCheck ? 'Free' : isAllInCall ? myPlayer.chips.toLocaleString() : callDiff.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </button>

        {/* Raise / Bet Button (Royal Blue Background, Arrow Up, Text: Raise) */}
        <button
          onClick={handleRaise}
          disabled={isPending || !isMyTurn || !canRaise}
          className={`h-[56px] rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 border ${
            isMyTurn && canRaise
              ? 'bg-[#1464c8] hover:bg-[#1875e8] border-blue-400/60 text-white shadow-[0_0_18px_rgba(37,99,235,0.35)]'
              : 'bg-[#0a182e] border-blue-950/60 text-slate-500 cursor-not-allowed opacity-50'
          }`}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <>
              <ArrowUp className="w-4 h-4 text-white stroke-[2.5]" />
              <span className="text-sm font-bold tracking-tight mt-0.5">
                {tableState.currentBet === 0 ? 'Bet' : canAllInRaise ? 'All-in' : 'Raise'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* ---------------- ROW 2: 5 QUICK PRESET BUTTONS (Min, 1/2 Pot, Pot, 2x Pot, All-in) ---------------- */}
      <div className="grid grid-cols-5 gap-1.5">
        <button
          type="button"
          onClick={() => setQuickRaise('min')}
          disabled={!isMyTurn || !canRaise}
          className={`py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 text-center ${
            raiseAmount === minTarget && isMyTurn
              ? 'bg-[#18263e] text-blue-300 border-blue-500/60'
              : 'bg-[#111927] hover:bg-[#182338] text-slate-300 border-slate-800'
          } disabled:opacity-40 disabled:pointer-events-none`}
        >
          Min
        </button>
        <button
          type="button"
          onClick={() => setQuickRaise(0.5)}
          disabled={!isMyTurn || !canRaise}
          className="py-1.5 bg-[#111927] hover:bg-[#182338] text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 active:scale-95 text-center disabled:opacity-40 disabled:pointer-events-none"
        >
          1/2 Pot
        </button>
        <button
          type="button"
          onClick={() => setQuickRaise(1)}
          disabled={!isMyTurn || !canRaise}
          className="py-1.5 bg-[#111927] hover:bg-[#182338] text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 active:scale-95 text-center disabled:opacity-40 disabled:pointer-events-none"
        >
          Pot
        </button>
        <button
          type="button"
          onClick={() => setQuickRaise(2)}
          disabled={!isMyTurn || !canRaise}
          className="py-1.5 bg-[#111927] hover:bg-[#182338] text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 active:scale-95 text-center disabled:opacity-40 disabled:pointer-events-none"
        >
          2x Pot
        </button>
        <button
          type="button"
          onClick={() => setQuickRaise('allin')}
          disabled={!isMyTurn || !canRaise}
          className="py-1.5 bg-[#111927] hover:bg-[#182338] text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 active:scale-95 text-center disabled:opacity-40 disabled:pointer-events-none"
        >
          All-in
        </button>
      </div>

      {/* ---------------- ROW 3: BET STEPPERS [-], SLIDER, [+] AND AMOUNT BOX ---------------- */}
      <div className="flex items-center gap-2">
        {/* [-] Stepper */}
        <button
          type="button"
          onClick={handleStepMinus}
          disabled={!isMyTurn || !canRaise || raiseAmount <= minTarget}
          className="w-10 h-9 rounded-xl bg-[#111927] hover:bg-[#182338] active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-bold flex items-center justify-center border border-slate-800 transition shrink-0"
          title="Уменьшить"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Glowing Blue Slider */}
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={minTarget}
            max={maxTarget}
            step={tableState.bigBlind}
            value={raiseAmount}
            disabled={!isMyTurn || !canRaise}
            onChange={(e) => setRaiseAmount(parseInt(e.target.value, 10))}
            className="w-full cursor-pointer accent-blue-500 h-2 bg-[#111927] rounded-lg appearance-none disabled:opacity-40"
          />
        </div>

        {/* [+] Stepper */}
        <button
          type="button"
          onClick={handleStepPlus}
          disabled={!isMyTurn || !canRaise || raiseAmount >= maxTarget}
          className="w-10 h-9 rounded-xl bg-[#111927] hover:bg-[#182338] active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-bold flex items-center justify-center border border-slate-800 transition shrink-0"
          title="Увеличить"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Amount Display Box (Screenshot Match: [ 2,000 ]) */}
        <div className="bg-[#0b1019] border border-slate-700/80 rounded-xl px-3 py-1.5 font-mono font-bold text-white text-xs sm:text-sm text-center min-w-[74px] shrink-0 shadow-inner">
          {raiseAmount.toLocaleString()}
        </div>
      </div>

      {/* ---------------- ROW 4: 3 STATS CARDS (Your chips, Current bet, Amount to call) ---------------- */}
      <div className="grid grid-cols-3 gap-2 pt-0.5">
        {/* Card 1: Your chips */}
        <div className="bg-[#0c121d] border border-white/[0.06] rounded-xl p-2 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-medium leading-tight">
            Your chips
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <BlueChipIcon />
            <span className="text-xs sm:text-sm font-bold font-mono text-white leading-tight">
              {myPlayer.chips.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: Current bet */}
        <div className="bg-[#0c121d] border border-white/[0.06] rounded-xl p-2 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-medium leading-tight">
            Current bet
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <BlueChipIcon />
            <span className="text-xs sm:text-sm font-bold font-mono text-white leading-tight">
              {myPlayer.currentBet.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3: Amount to call */}
        <div className="bg-[#0c121d] border border-white/[0.06] rounded-xl p-2 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-medium leading-tight">
            Amount to call
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <BlueChipIcon />
            <span className="text-xs sm:text-sm font-bold font-mono text-white leading-tight">
              {callDiff.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
