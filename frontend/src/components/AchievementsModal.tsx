import React, { useState } from 'react';
import { Achievement } from '../types';

interface AchievementsModalProps {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  onClose: () => void;
}

type CategoryType = 'all' | 'gameplay' | 'progression' | 'streak' | 'tournament' | 'social';

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  unlockedCount,
  totalCount,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');

  const categories: { key: CategoryType; label: string; icon: string }[] = [
    { key: 'all', label: 'Все', icon: '🌟' },
    { key: 'gameplay', label: 'Игра', icon: '🏆' },
    { key: 'progression', label: 'Прогресс', icon: '📈' },
    { key: 'streak', label: 'Серии', icon: '🔥' },
    { key: 'tournament', label: 'Турниры', icon: '🏟' },
    { key: 'social', label: 'Друзья', icon: '👥' }
  ];

  const filtered = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const percent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎖</span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">Достижения</h2>
                <p className="text-xs text-purple-400/80">Ваши трофеи и награды в клубе</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
            >
              ✕
            </button>
          </div>

          {/* Overall Progress */}
          <div className="mt-3 bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-medium">
              <span>Открыто достижений</span>
              <span className="text-purple-300 font-bold">{unlockedCount} из {totalCount} ({percent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-500 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 p-2 overflow-x-auto bg-black/20 border-b border-white/5 scrollbar-none">
          {categories.map(c => {
            const isActive = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {filtered.map(a => {
            return (
              <div
                key={a.id}
                className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                  a.unlocked
                    ? 'bg-gradient-to-r from-purple-900/20 to-slate-900 border-purple-500/40 shadow-sm shadow-purple-500/10'
                    : 'bg-slate-900/40 border-white/5 opacity-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                  a.unlocked ? 'bg-purple-500/20 border border-purple-500/40' : 'bg-white/5 border border-white/5 grayscale'
                }`}>
                  {a.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-sm font-bold text-white truncate">{a.title}</h4>
                    {a.unlocked && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        ✓ Открыто
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{a.description}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      +${a.rewardChips.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-400/10 px-1.5 py-0.5 rounded border border-purple-400/20">
                      +{a.rewardXp} XP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
