import React, { useState } from 'react';
import { Quest } from '../types';

interface QuestsViewProps {
  quests: { daily: Quest[]; weekly: Quest[] };
  onClaim: (questId: string) => void;
  onClose: () => void;
}

export const QuestsView: React.FC<QuestsViewProps> = ({ quests, onClaim, onClose }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const currentQuests = activeTab === 'daily' ? quests.daily : quests.weekly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Квесты и Задания</h2>
              <p className="text-xs text-amber-400/80">Выполняйте задачи и получайте фишки и XP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 p-2 gap-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>☀️</span>
            <span>Ежедневные ({quests.daily.filter(q => q.completed && !q.claimed).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'weekly'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🗓️</span>
            <span>Еженедельные ({quests.weekly.filter(q => q.completed && !q.claimed).length})</span>
          </button>
        </div>

        {/* Quest List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {currentQuests.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Нет доступных квестов
            </div>
          ) : (
            currentQuests.map((quest) => {
              const progressPct = Math.min(100, Math.round((quest.progress / quest.target) * 100));

              return (
                <div
                  key={quest.id}
                  className={`p-3.5 rounded-xl border transition ${
                    quest.claimed
                      ? 'bg-white/5 border-white/5 opacity-60'
                      : quest.completed
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-800/60 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {quest.completed && !quest.claimed && <span className="animate-pulse">✨</span>}
                        {quest.title}
                      </h4>
                      <p className="text-xs text-gray-300 mt-0.5">{quest.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        +${quest.rewardChips.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-400/10 px-1.5 py-0.5 rounded-full border border-purple-400/20">
                        +{quest.rewardXp} XP
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Прогресс</span>
                      <span className="font-semibold text-white">
                        {quest.progress} / {quest.target} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          quest.completed
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
                    {quest.claimed ? (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        ✓ Награда получена
                      </span>
                    ) : quest.completed ? (
                      <button
                        onClick={() => onClaim(quest.id)}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-md shadow-amber-500/30 transform active:scale-95 transition"
                      >
                        Забрать награду 🎁
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-500">В процессе</span>
                    )}
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
