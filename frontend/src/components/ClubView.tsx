import React, { useState } from 'react';
import { haptic, getTelegramWebApp } from '../utils/telegram';
import { Users, Copy, Check, Share2, Gift, Sparkles, UserCheck } from 'lucide-react';

interface ClubViewProps {
  userId: string;
  referralCount: number;
  referralEarnings: number;
  invitedFriends?: { id: string; name: string; date: number; bonus: number }[];
}

export const ClubView: React.FC<ClubViewProps> = ({
  userId,
  referralCount,
  referralEarnings,
  invitedFriends = []
}) => {
  const [copied, setCopied] = useState(false);

  const botUsername = 'RoyalsPokerBot';
  const refLink = `https://t.me/${botUsername}?start=ref_${userId}`;
  const shareText = 'Играй со мной в онлайн-покер в Telegram! Заходи и забирай 3,500 бесплатных фишек на старт ♠️🎁';

  const handleCopy = () => {
    haptic.light();
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    haptic.medium();
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-28 animate-fadeIn select-none">
      {/* Referral Program Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-purple-500/30 p-5 shadow-2xl relative overflow-hidden flex flex-col gap-3">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-300" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5">
              <span>Реферальный Клуб</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400">
              Приглашайте друзей и играйте за одним столом
            </p>
          </div>
        </div>

        {/* Reward Value Cards */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="rounded-xl bg-slate-900/80 border border-emerald-500/30 p-3 flex flex-col items-center text-center">
            <Gift className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-[10px] text-slate-400">Друг получит:</span>
            <span className="font-mono font-black text-emerald-400 text-sm mt-0.5">+1,000</span>
            <span className="text-[10px] text-slate-500">фишек на старт</span>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-amber-500/30 p-3 flex flex-col items-center text-center shadow-lg shadow-amber-950/20">
            <Sparkles className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-400">Вы получите:</span>
            <span className="font-mono font-black text-amber-400 text-sm mt-0.5">+2,500</span>
            <span className="text-[10px] text-slate-500">фишек за каждого</span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass-card rounded-xl p-3.5 flex flex-col items-center text-center">
          <span className="text-xs text-slate-400">Приглашено друзей</span>
          <span className="text-2xl font-black font-mono text-slate-100 mt-1">
            {referralCount} <span className="text-xs font-normal text-slate-400">чел.</span>
          </span>
        </div>

        <div className="glass-card rounded-xl p-3.5 flex flex-col items-center text-center">
          <span className="text-xs text-slate-400">Заработано бонусов</span>
          <span className="text-2xl font-black font-mono text-amber-300 mt-1">
            +${referralEarnings.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Copy & Share Referral Link */}
      <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-xs font-bold text-slate-300">
          Ваша персональная ссылка:
        </span>

        <div className="flex items-center gap-2 bg-slate-950/80 rounded-xl p-1.5 border border-white/[0.08]">
          <input
            type="text"
            readOnly
            value={refLink}
            className="flex-1 bg-transparent px-2.5 text-xs text-slate-300 font-mono truncate focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопировано' : 'Копировать'}</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/50 active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-300"
        >
          <Share2 className="w-4 h-4" />
          <span>Поделиться в Telegram</span>
        </button>
      </div>

      {/* Invited Friends List */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-slate-300 px-1">
          Приглашенные игроки:
        </h3>

        {invitedFriends.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center flex flex-col items-center gap-2 text-slate-500 text-xs">
            <UserCheck className="w-6 h-6 opacity-40" />
            <span>Вы пока не пригласили ни одного друга. Отправьте ссылку, чтобы получить первые +2,500 фишек!</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {invitedFriends.map((friend, idx) => (
              <div
                key={`${friend.id}-${idx}`}
                className="glass-card rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                    {friend.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-200">{friend.name}</span>
                </div>

                <span className="font-mono font-bold text-amber-400">
                  +${friend.bonus.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
