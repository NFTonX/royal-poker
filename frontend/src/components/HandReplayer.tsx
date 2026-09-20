import React, { useState, useEffect } from 'react';
import { HandRecord, Card as CardType } from '../types';
import { CardView } from './CardView';

interface HandReplayerProps {
  hand: HandRecord;
  onClose: () => void;
}

export const HandReplayer: React.FC<HandReplayerProps> = ({ hand, onClose }) => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const totalSteps = hand.actionLog.length;
  const currentAction = stepIndex > 0 ? hand.actionLog[stepIndex - 1] : null;

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPlaying) {
      if (stepIndex >= totalSteps) {
        setIsPlaying(false);
      } else {
        timer = setTimeout(() => {
          setStepIndex(prev => prev + 1);
        }, 1400);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, stepIndex, totalSteps]);

  // Determine which community cards are visible based on current stage
  const currentStage = currentAction ? currentAction.stage : 'PREFLOP';
  let visibleBoardCards: CardType[] = [];
  if (currentStage === 'FLOP') {
    visibleBoardCards = hand.communityCards.slice(0, 3);
  } else if (currentStage === 'TURN') {
    visibleBoardCards = hand.communityCards.slice(0, 4);
  } else if (currentStage === 'RIVER' || currentStage === 'SHOWDOWN' || stepIndex === totalSteps) {
    visibleBoardCards = hand.communityCards;
  }

  // Current pot
  const currentPot = currentAction ? currentAction.pot : (hand.smallBlind + hand.bigBlind);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-lg animate-fadeIn select-none">
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-emerald-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎬</span>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Повтор раздачи #{hand.id.slice(-6)}</h3>
              <p className="text-[11px] text-emerald-400 font-medium">{hand.tableName} • Блайнды ${hand.smallBlind}/${hand.bigBlind}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* Replayer Poker Table Surface */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center relative min-h-[300px] overflow-hidden">
          {/* Felt */}
          <div className="w-full max-w-sm aspect-[16/10] bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-[60px] border-4 border-amber-900/60 shadow-inner relative flex flex-col items-center justify-center p-3">
            {/* Table Logo & Pot */}
            <div className="absolute top-4 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300/40">Royals Poker</span>
              <div className="bg-black/60 px-3 py-0.5 rounded-full border border-amber-500/30 text-xs font-bold text-amber-300 shadow">
                Банк: ${currentPot.toLocaleString()}
              </div>
            </div>

            {/* Community Cards */}
            <div className="flex gap-1.5 my-auto z-10">
              {hand.communityCards.map((card, idx) => {
                const isVisible = idx < visibleBoardCards.length;
                return isVisible ? (
                  <div key={idx} className="transform transition duration-300 scale-90">
                    <CardView card={card} />
                  </div>
                ) : (
                  <div key={idx} className="w-9 h-13 rounded-lg border border-dashed border-emerald-500/30 bg-black/20 flex items-center justify-center text-[10px] text-emerald-500/40">
                    ?
                  </div>
                );
              })}
            </div>

            {/* Last Action Indicator Pill */}
            {currentAction && (
              <div className="absolute bottom-3 bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-white/20 text-xs font-bold text-white shadow-lg animate-bounce">
                <span className="text-amber-400">{currentAction.playerName}</span>: {currentAction.action} {currentAction.amount ? `$${currentAction.amount.toLocaleString()}` : ''}
              </div>
            )}
          </div>

          {/* Seats Display */}
          <div className="w-full grid grid-cols-3 gap-2 mt-3 max-h-[140px] overflow-y-auto">
            {hand.seats.map((seat) => {
              const isCurrentTurn = currentAction?.seatIndex === seat.seatIndex;
              const isWinner = hand.winners.some(w => w.playerId === seat.id);

              return (
                <div
                  key={seat.id}
                  className={`p-1.5 rounded-xl border flex flex-col items-center transition ${
                    isWinner && (stepIndex === totalSteps || currentStage === 'SHOWDOWN')
                      ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/20'
                      : isCurrentTurn
                      ? 'bg-blue-500/20 border-blue-400'
                      : 'bg-black/40 border-white/5'
                  }`}
                >
                  <span className="text-[11px] font-bold text-white truncate max-w-[90px]">{seat.name}</span>
                  <div className="flex gap-1 my-1">
                    {seat.cards && seat.cards.length > 0 ? (
                      seat.cards.map((c, i) => (
                        <div key={i} className="transform scale-75 origin-top -mx-1">
                          <CardView card={c} />
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-gray-500">Сбросил</div>
                    )}
                  </div>
                  {isWinner && (stepIndex === totalSteps || currentStage === 'SHOWDOWN') && (
                    <span className="text-[9px] font-extrabold text-amber-300">👑 Победитель</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex flex-col gap-2">
          {/* Progress Slider */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Действие {stepIndex} из {totalSteps}</span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider">{currentStage}</span>
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
              style={{ width: `${totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3 mt-1">
            <button
              onClick={() => { setStepIndex(0); setIsPlaying(false); }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
              title="В начало"
            >
              🔄
            </button>

            <button
              onClick={() => { setStepIndex(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
              disabled={stepIndex <= 0}
              className="p-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold transition"
              title="Предыдущее действие"
            >
              ⏮
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-sm shadow-md shadow-emerald-500/20 transform active:scale-95 transition"
            >
              {isPlaying ? '⏸ Пауза' : stepIndex >= totalSteps ? '🔄 Сначала' : '▶ Воспроизвести'}
            </button>

            <button
              onClick={() => { setStepIndex(prev => Math.min(totalSteps, prev + 1)); setIsPlaying(false); }}
              disabled={stepIndex >= totalSteps}
              className="p-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold transition"
              title="Следующее действие"
            >
              ⏭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
