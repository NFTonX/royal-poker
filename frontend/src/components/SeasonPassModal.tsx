import React from 'react';
import { SeasonPassTier } from '../types';

interface SeasonPassModalProps {
  seasonData: {
    seasonNumber: number;
    seasonName: string;
    seasonXp: number;
    tiers: SeasonPassTier[];
  } | null;
  onClaimTier: (tierNumber: number) => void;
  onClose: () => void;
}

export const SeasonPassModal: React.FC<SeasonPassModalProps> = ({
  seasonData,
  onClaimTier,
  onClose
}) => {
  if (!seasonData) return null;

  const currentXp = seasonData.seasonXp;
  const maxTierXp = seasonData.tiers[seasonData.tiers.length - 1]?.requiredXp || 7000;
  const overallPercent = Math.min(100, Math.round((currentXp / maxTierXp) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-black">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👑</span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Сезон {seasonData.seasonNumber}: {seasonData.seasonName}
                </h2>
                <p className="text-xs text-amber-300/80">Сезонный боевой пропуск</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
            >
              ✕
            </button>
          </div>

          {/* Season XP Bar */}
          <div className="mt-3 bg-black/50 rounded-xl p-3 border border-white/10">
            <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-semibold">
              <span>Сезонный опыт</span>
              <span className="text-amber-300 font-bold">{currentXp.toLocaleString()} / {maxTierXp.toLocaleString()} XP ({overallPercent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tiers List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {seasonData.tiers.map((tier) => {
            const isUnlocked = tier.unlocked;
            const isClaimed = tier.claimed;

            return (
              <div
                key={tier.tier}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                  isClaimed
                    ? 'bg-white/5 border-white/5 opacity-60'
                    : isUnlocked
                    ? 'bg-gradient-to-r from-amber-950/30 to-purple-950/20 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-900/50 border-white/5 opacity-50'
                }`}
              >
                {/* Level Badge */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {tier.tier}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">
                        Уровень {tier.tier}
                      </h4>
                      <span className="text-[10px] text-gray-400">
                        ({tier.requiredXp} XP)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        🎁 {tier.freeReward.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Claim Button */}
                <div>
                  {isClaimed ? (
                    <span className="text-xs text-emerald-400 font-bold px-2 py-1">
                      ✓ Забрано
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => onClaimTier(tier.tier)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-md shadow-amber-500/30 transform active:scale-95 transition"
                    >
                      Забрать
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      🔒 Закрыто
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
