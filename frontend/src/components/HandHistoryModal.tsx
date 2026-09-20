import React, { useState } from 'react';
import { HandRecord } from '../types';
import { CardView } from './CardView';
import { HandReplayer } from './HandReplayer';

interface HandHistoryModalProps {
  hands: HandRecord[];
  onClose: () => void;
}

export const HandHistoryModal: React.FC<HandHistoryModalProps> = ({ hands, onClose }) => {
  const [selectedHand, setSelectedHand] = useState<HandRecord | null>(null);

  if (selectedHand) {
    return <HandReplayer hand={selectedHand} onClose={() => setSelectedHand(null)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">История Раздач</h2>
              <p className="text-xs text-blue-400/80">Последние 30 сыгранных раздач</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {hands.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl block mb-2">🃏</span>
              <p className="text-sm">История пуста. Сыграйте свою первую раздачу за столом!</p>
            </div>
          ) : (
            hands.map((hand) => {
              const dateStr = new Date(hand.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isWin = hand.result === 'WIN';
              const isFold = hand.result === 'FOLD';

              return (
                <div
                  key={hand.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isWin
                      ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/40 shadow-sm'
                      : isFold
                      ? 'bg-slate-900/50 border-white/5 opacity-80'
                      : 'bg-red-950/20 border-red-500/30'
                  }`}
                >
                  {/* Top line: Table & Result */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">{hand.tableName}</span>
                      <span className="text-[10px] text-gray-400">{dateStr}</span>
                    </div>

                    <div>
                      {isWin ? (
                        <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/30">
                          +${hand.netChips.toLocaleString()}
                        </span>
                      ) : isFold ? (
                        <span className="text-xs font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                          Фолд
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/30">
                          -${Math.abs(hand.netChips).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hole Cards & Board Cards */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    {/* Hole cards */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 mb-1">Ваши карты:</span>
                      <div className="flex gap-1">
                        {hand.myHoleCards && hand.myHoleCards.length > 0 ? (
                          hand.myHoleCards.map((c, i) => (
                            <div key={i} className="transform scale-75 origin-top-left -mr-2">
                              <CardView card={c} />
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Скрыты</span>
                        )}
                      </div>
                    </div>

                    {/* Community Cards */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 mb-1">Стол:</span>
                      <div className="flex gap-0.5">
                        {hand.communityCards.map((c, i) => (
                          <div key={i} className="transform scale-75 origin-top-right -ml-2">
                            <CardView card={c} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Pot and Replay Button */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <span className="text-xs text-amber-300 font-semibold">
                      Банк: ${hand.pot.toLocaleString()}
                    </span>

                    <button
                      onClick={() => setSelectedHand(hand)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                    >
                      <span>🎬</span>
                      <span>Повтор</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
