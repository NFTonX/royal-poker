import React, { useEffect, useState } from 'react';
import { Card, Player, TableState } from '../types';
import { CardView } from './CardView';
import { ChipStack } from './ChipStack';
import { UserPlus, Bot, Clock } from 'lucide-react';

interface PlayerSeatProps {
  seatIndex: number;
  player: Player | null;
  tableState: TableState;
  currentUserId: string;
  onJoin: (seatIndex: number) => void;
  positionClass: string;
  reaction?: string | null;
  isHero?: boolean;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  seatIndex,
  player,
  tableState,
  currentUserId,
  onJoin,
  positionClass,
  reaction,
  isHero = false
}) => {
  const isCurrentTurn = tableState.currentTurnSeat === seatIndex;
  const isDealer = tableState.dealerSeat === seatIndex;
  const isMe = player?.id === currentUserId;

  // Turn timer countdown
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!isCurrentTurn || !tableState.turnStartTime) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = (Date.now() - (tableState.turnStartTime || Date.now())) / 1000;
      const remaining = Math.max(0, tableState.turnTimeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));
    }, 200);

    return () => clearInterval(interval);
  }, [isCurrentTurn, tableState.turnStartTime, tableState.turnTimeLimit]);

  // Empty Seat
  if (!player) {
    return (
      <div className={`absolute ${positionClass} flex flex-col items-center justify-center z-10 select-none`}>
        <div className="flex flex-col gap-1 items-center group">
          <button
            onClick={() => onJoin(seatIndex)}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-emerald-500/40 bg-black/60 hover:bg-emerald-950/60 active:scale-95 flex flex-col items-center justify-center text-emerald-400 transition-all backdrop-blur-sm shadow-[0_4px_15px_rgba(0,0,0,0.6)] group-hover:border-emerald-400"
            title="Занять место"
          >
            <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] font-black tracking-wider mt-0.5">СЕСТЬ</span>
          </button>
        </div>
      </div>
    );
  }

  const isFolded = player.status === 'FOLDED';
  const isAllIn = player.status === 'ALL_IN';
  const timerPercentage = isCurrentTurn && tableState.turnTimeLimit > 0
    ? (timeLeft / tableState.turnTimeLimit) * 100
    : 0;

  const timerColor = timeLeft <= 5 ? '#ef4444' : '#06b6d4';
  const hasLastAction = tableState.lastAction?.playerId === player.id;

  const isWinningCard = (card: Card) => {
    return !!tableState.handResult?.winners.some(w =>
      w.playerId === player.id && w.bestCards?.some(bc => bc.code === card.code)
    );
  };

  // ---------------- HERO SEAT (Bottom Center - Exact Match to Screenshot) ----------------
  if (isHero) {
    return (
      <div
        className={`absolute ${positionClass} flex flex-col items-center z-30 select-none transition-all duration-300 ${
          isFolded ? 'opacity-40 grayscale-[60%]' : ''
        }`}
      >
        {/* Bet on table in front of Hero */}
        {player.currentBet > 0 && (
          <div className="mb-1.5 animate-fadeIn">
            <ChipStack amount={player.currentBet} size="md" />
          </div>
        )}

        {/* Floating Reaction Bubble */}
        {reaction && (
          <div className="absolute -top-12 z-50 text-3xl animate-bounce filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
            {reaction}
          </div>
        )}

        {/* Action Indicator Bubble */}
        {hasLastAction && tableState.lastAction && (
          <div className="absolute -top-7 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.7)] border border-white animate-bounce whitespace-nowrap z-40 flex items-center gap-1">
            <span>{tableState.lastAction.action}</span>
            {tableState.lastAction.amount && (
              <span className="font-mono font-bold">${tableState.lastAction.amount.toLocaleString()}</span>
            )}
          </div>
        )}

        {/* HERO CARDS (Fanned slightly: J♠ 10♠ style) */}
        {player.cards && player.cards.length === 2 && (
          <div className="flex items-center justify-center -space-x-2 mb-1.5 z-30 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]">
            <CardView
              card={player.cards[0]}
              size="lg"
              highlighted={isWinningCard(player.cards[0])}
              className={`-rotate-3 transition-all duration-300 ${
                isCurrentTurn
                  ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.7)] -translate-y-1'
                  : ''
              }`}
            />
            <CardView
              card={player.cards[1]}
              size="lg"
              highlighted={isWinningCard(player.cards[1])}
              className={`rotate-3 transition-all duration-300 ${
                isCurrentTurn
                  ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.7)] -translate-y-1'
                  : ''
              }`}
            />
          </div>
        )}

        {/* Hero Glowing Cyan Capsule (Screenshot Match) */}
        <div className="flex items-center gap-2 bg-[#071322]/95 backdrop-blur-md px-2.5 py-1 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
          {/* Avatar with cyan ring */}
          <div className="relative flex items-center justify-center">
            {isCurrentTurn && (
              <svg className="absolute -inset-1.5 w-10 h-10 -rotate-90 pointer-events-none z-10">
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="2.5" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="2.5"
                  strokeDasharray="100"
                  strokeDashoffset={100 - (100 * timerPercentage) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-100 ease-linear drop-shadow-[0_0_6px_rgba(6,182,212,0.9)]"
                />
              </svg>
            )}

            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-cyan-400 shadow-md relative overflow-hidden bg-gradient-to-tr from-cyan-950 via-slate-900 to-cyan-900 text-cyan-200">
              <span className="font-mono tracking-tighter">
                {player.name.substring(0, 2).toUpperCase()}
              </span>
              {isAllIn && (
                <div className="absolute inset-0 bg-red-600/90 flex items-center justify-center text-[7px] font-black text-white">
                  ALL IN
                </div>
              )}
            </div>
          </div>

          {/* Center: "You" + chips + green online dot */}
          <div className="flex flex-col pr-1">
            <span className="text-[11px] font-bold text-white leading-tight">
              You
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-black font-mono text-slate-100 leading-tight">
                {tableState.currency === 'TON' ? `${player.chips.toFixed(2)} TON` : player.chips.toLocaleString()}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
            </div>
          </div>

          {/* Right: Timer Capsule (15s) */}
          <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/60 px-2 py-0.5 rounded-full text-emerald-400 font-mono text-[10px] font-bold shadow-sm">
            <Clock className="w-2.5 h-2.5 text-emerald-400" />
            <span>{timeLeft > 0 ? `${timeLeft}s` : '15s'}</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- OPPONENT SEATS (Tilted Blue Cards Behind Avatar) ----------------
  return (
    <div
      className={`absolute ${positionClass} flex flex-col items-center z-20 select-none transition-all duration-300 ${
        isFolded ? 'opacity-40 grayscale-[60%]' : ''
      }`}
    >
      {/* Floating Reaction Bubble */}
      {reaction && (
        <div className="absolute -top-12 z-50 text-3xl animate-bounce filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
          {reaction}
        </div>
      )}

      {/* Action Indicator Bubble */}
      {hasLastAction && tableState.lastAction && (
        <div className="absolute -top-6 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.6)] border border-white/80 animate-bounce whitespace-nowrap z-30 flex items-center gap-1">
          <span>{tableState.lastAction.action}</span>
          {tableState.lastAction.amount && (
            <span className="font-mono font-bold">${tableState.lastAction.amount.toLocaleString()}</span>
          )}
        </div>
      )}

      {/* Opponent Cards (Tilted Behind Avatar) */}
      {!isFolded && tableState.status === 'IN_PROGRESS' && (
        <div className="absolute -top-4 flex items-center justify-center pointer-events-none z-0">
          {player.cards && player.cards.length === 2 ? (
            <>
              <CardView
                card={player.cards[0]}
                size="xs"
                highlighted={isWinningCard(player.cards[0])}
                className="-rotate-6 -mr-1.5 shadow-lg"
              />
              <CardView
                card={player.cards[1]}
                size="xs"
                highlighted={isWinningCard(player.cards[1])}
                className="rotate-6 shadow-lg"
              />
            </>
          ) : (
            <>
              <CardView hidden size="xs" className="-rotate-6 -mr-1.5 shadow-lg" />
              <CardView hidden size="xs" className="rotate-6 shadow-lg" />
            </>
          )}
        </div>
      )}

      {/* Avatar Container with Turn Progress Ring */}
      <div className="relative flex items-center justify-center z-10">
        {/* Turn Progress SVG Ring */}
        {isCurrentTurn && (
          <svg className="absolute -inset-1.5 w-13 h-13 sm:w-14 sm:h-14 -rotate-90 pointer-events-none z-10">
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="3" />
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke={timerColor}
              strokeWidth="3"
              strokeDasharray="138"
              strokeDashoffset={138 - (138 * timerPercentage) / 100}
              strokeLinecap="round"
              className="transition-all duration-100 ease-linear drop-shadow-[0_0_6px_rgba(6,182,212,0.9)]"
            />
          </svg>
        )}

        {/* Circular Avatar Body */}
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-lg relative overflow-hidden transition-all duration-200 border-slate-700/80 ${
            isCurrentTurn
              ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-105'
              : isMe
              ? 'bg-gradient-to-tr from-cyan-950 via-slate-900 to-cyan-900 text-cyan-200 border-cyan-400'
              : 'bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 text-slate-200'
          }`}
        >
          {player.isBot ? (
            <Bot className="w-5 h-5 text-cyan-400" />
          ) : (
            <span className="font-mono tracking-tighter">
              {player.name.substring(0, 2).toUpperCase()}
            </span>
          )}

          {/* All-in Badge Overlay */}
          {isAllIn && (
            <div className="absolute inset-0 bg-red-600/90 flex items-center justify-center text-[8px] font-black text-white tracking-widest">
              ALL IN
            </div>
          )}

          {/* Fold Badge Overlay */}
          {isFolded && (
            <div className="absolute inset-0 bg-black/85 flex items-center justify-center text-[8px] font-black text-slate-400 tracking-wider">
              FOLD
            </div>
          )}
        </div>

        {/* Dealer Button Badge (White circle 'D' as in screenshot) */}
        {isDealer && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-300 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-md z-20 font-mono">
            D
          </div>
        )}
      </div>

      {/* Name and Stack Capsule (Pill with green dot as in screenshot) */}
      <div className="mt-1 bg-[#0c131f]/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/[0.08] shadow-md flex flex-col items-center min-w-[68px] z-10">
        <span className="text-[10px] font-semibold text-slate-200 truncate w-full text-center leading-tight">
          {player.name}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold font-mono text-slate-300 leading-tight">
            {tableState.currency === 'TON' ? `${player.chips.toFixed(2)} TON` : player.chips.toLocaleString()}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
        </div>
      </div>

      {/* Current Bet on Table */}
      {player.currentBet > 0 && (
        <div className="mt-1 animate-fadeIn z-10">
          <ChipStack amount={player.currentBet} size="sm" />
        </div>
      )}
    </div>
  );
};
