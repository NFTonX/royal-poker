import React from 'react';
import { User } from '../types';
import { Crown, Trophy, Target, Gift, Users, ShieldCheck, Sparkles, Flame, History, Award, Shirt, Star } from 'lucide-react';

interface ProfileViewProps {
  user: User | null;
  onOpenShop: () => void;
  onClaimDailyBonus: () => void;
  referralEarnings: number;
  referralCount: number;
  onOpenHistory: () => void;
  onOpenAchievements: () => void;
  onOpenCosmetics: () => void;
  onOpenSeasonPass: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onOpenShop,
  onClaimDailyBonus,
  referralEarnings,
  referralCount,
  onOpenHistory,
  onOpenAchievements,
  onOpenCosmetics,
  onOpenSeasonPass
}) => {
  const handsPlayed = user?.handsPlayed || 0;
  const handsWon = user?.handsWon || 0;
  const winRate = handsPlayed > 0 ? Math.round((handsWon / handsPlayed) * 100) : 0;

  // Level & XP calculations
  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const nextLevelXp = Math.pow(level, 2) * 150;
  const prevLevelXp = Math.pow(level - 1, 2) * 150;
  const levelProgressXp = Math.max(0, xp - prevLevelXp);
  const levelTargetXp = Math.max(1, nextLevelXp - prevLevelXp);
  const xpPercent = Math.min(100, Math.round((levelProgressXp / levelTargetXp) * 100));

  // Level Titles
  const getLevelTitle = (lvl: number) => {
    if (lvl >= 10) return 'Мастер Клуба';
    if (lvl >= 7) return 'Хайроллер';
    if (lvl >= 5) return 'Восходящая Звезда';
    if (lvl >= 3) return 'Опытный Игрок';
    return 'Новичок Клуба';
  };

  // VIP Tier based on chips
  const getVipTier = (chips: number) => {
    if (chips >= 100000) return { name: 'Diamond VIP', color: 'text-cyan-300', border: 'border-cyan-400', bg: 'from-cyan-950 to-slate-900' };
    if (chips >= 25000) return { name: 'Platinum', color: 'text-purple-300', border: 'border-purple-400', bg: 'from-purple-950 to-slate-900' };
    if (chips >= 5000) return { name: 'Gold', color: 'text-amber-300', border: 'border-amber-400', bg: 'from-amber-950 to-slate-900' };
    return { name: 'Silver', color: 'text-slate-300', border: 'border-slate-500', bg: 'from-slate-900 to-slate-950' };
  };

  const vip = getVipTier(user?.chips || 0);

  return (
    <div className="flex flex-col gap-3.5 p-4 pb-28 animate-fadeIn select-none">
      {/* Player Header Card */}
      <div className={`rounded-2xl bg-gradient-to-br ${vip.bg} border ${vip.border} p-4 sm:p-5 shadow-2xl relative overflow-hidden`}>
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          {/* Avatar with VIP border */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-amber-300 font-bold text-xl font-mono">
                {user?.firstName?.substring(0, 2).toUpperCase() || 'PL'}
              </div>
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 bg-slate-950 p-1 rounded-full border border-amber-500/50 shadow">
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 truncate">
                {user?.firstName || 'Игрок'}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${vip.border} ${vip.color} bg-black/40 shrink-0`}>
                {vip.name}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {user?.username ? `@${user.username}` : `ID: ${user?.id || '---'}`}
            </span>

            {/* Level Title */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-bold text-amber-300">
                Ур. {level}: {getLevelTitle(level)}
              </span>
            </div>
          </div>
        </div>

        {/* Level & XP Progress Bar */}
        <div className="mt-3 bg-black/40 rounded-xl p-2.5 border border-white/5">
          <div className="flex justify-between text-[11px] text-gray-300 mb-1 font-semibold">
            <span className="flex items-center gap-1 text-purple-300">
              <Star className="w-3 h-3 fill-purple-400" />
              Опыт (XP)
            </span>
            <span className="text-purple-200">
              {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} ({xpPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-500 rounded-full"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Balance Card */}
        <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Текущий Баланс
            </span>
            <span className="text-2xl font-black font-mono text-amber-300 drop-shadow">
              ${user?.chips?.toLocaleString() || 0}
            </span>
          </div>

          <button
            onClick={onOpenShop}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 border border-amber-300 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Пополнить ⭐️</span>
          </button>
        </div>
      </div>

      {/* Quick Access Menu: Ecosystem Tools */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onOpenHistory}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 flex flex-col items-center gap-1 active:scale-95 transition shadow-sm"
        >
          <History className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-bold text-gray-200">История</span>
        </button>

        <button
          onClick={onOpenAchievements}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 flex flex-col items-center gap-1 active:scale-95 transition shadow-sm"
        >
          <Award className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-bold text-gray-200">Трофеи</span>
        </button>

        <button
          onClick={onOpenCosmetics}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 flex flex-col items-center gap-1 active:scale-95 transition shadow-sm"
        >
          <Shirt className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-bold text-gray-200">Гардероб</span>
        </button>

        <button
          onClick={onOpenSeasonPass}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 flex flex-col items-center gap-1 active:scale-95 transition shadow-sm"
        >
          <Crown className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-bold text-gray-200">Сезон 1</span>
        </button>
      </div>

      {/* Performance Statistics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Hands Played */}
        <div className="glass-card rounded-xl p-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>Сыграно раздач</span>
          </div>
          <span className="text-lg font-black font-mono text-slate-100 mt-0.5">
            {handsPlayed.toLocaleString()}
          </span>
        </div>

        {/* Hands Won */}
        <div className="glass-card rounded-xl p-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Побед за столом</span>
          </div>
          <span className="text-lg font-black font-mono text-amber-300 mt-0.5">
            {handsWon.toLocaleString()}
          </span>
        </div>

        {/* Win Rate */}
        <div className="glass-card rounded-xl p-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Винрейт</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black font-mono text-emerald-400">
              {winRate}%
            </span>
            <span className="text-[10px] text-slate-500">от всех игр</span>
          </div>
        </div>

        {/* Winning Streaks */}
        <div className="glass-card rounded-xl p-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Серия побед</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black font-mono text-rose-400">
              {user?.currentStreak || 0}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              (Рекорд: {user?.bestStreak || 0})
            </span>
          </div>
        </div>

        {/* Biggest Pot Won */}
        <div className="glass-card rounded-xl p-3 flex flex-col gap-0.5">
          <span className="text-xs text-slate-400">Крупнейший банк</span>
          <span className="text-base font-black font-mono text-amber-300 mt-0.5">
            ${(user?.biggestPotWon || 0).toLocaleString()}
          </span>
        </div>

        {/* Referral Earnings */}
        <div className="glass-card rounded-xl p-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Рефералы</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black font-mono text-purple-300">
              {referralCount}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              (+${referralEarnings.toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      {/* Daily Bonus Card */}
      <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center">
            <Gift className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-slate-100">Ежедневный Бонус</span>
            <span className="text-[11px] text-slate-400">+1,000 фишек и +100 XP</span>
          </div>
        </div>

        <button
          onClick={onClaimDailyBonus}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-bold text-xs shadow-md border border-emerald-400/40 transition-all"
        >
          Забрать 🎁
        </button>
      </div>

      {/* Fair Play & Integrity Note */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
        <span>Честная игра • Генератор случайных чисел SHA-256</span>
      </div>
    </div>
  );
};
