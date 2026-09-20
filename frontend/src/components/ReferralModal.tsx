import React, { useState } from 'react';
import { haptic, getTelegramWebApp } from '../utils/telegram';
import { X, Users, Copy, Check, Share2, Gift, Sparkles } from 'lucide-react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  referralCount: number;
  referralEarnings: number;
  invitedFriends?: { id: string; name: string; date: number; bonus: number }[];
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  userId,
  referralCount,
  referralEarnings,
  invitedFriends = []
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-amber-500/30 p-5 shadow-2xl shadow-amber-950/40 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 active:scale-95 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5 mt-1">
            Пригласи друзей
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h3>
          <p className="text-xs text-slate-400">
            Получайте фишки за каждого приглашенного друга!
          </p>
        </div>

        {/* Bonus Info Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col items-center text-center">
            <Gift className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-[10px] text-slate-400">Друг получит:</span>
            <span className="font-bold text-sm text-emerald-400 font-mono">+1,000</span>
            <span className="text-[10px] text-slate-500">фишек бонуса</span>
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-amber-500/40 p-3 flex flex-col items-center text-center shadow-lg shadow-amber-950/20">
            <Sparkles className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-400">Вы получите:</span>
            <span className="font-bold text-sm text-amber-400 font-mono">+2,500</span>
            <span className="text-[10px] text-slate-500">фишек за друга</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-around bg-slate-900/50 rounded-xl p-2.5 border border-slate-800 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[11px]">Приглашено</span>
            <span className="font-bold text-sm text-slate-100">{referralCount} чел.</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[11px]">Заработано</span>
            <span className="font-bold text-sm text-amber-400 font-mono">
              +${referralEarnings.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Referral Link Box */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400">
            Ваша реферальная ссылка:
          </label>
          <div className="flex items-center gap-1.5 bg-slate-950 rounded-xl p-1.5 border border-slate-800">
            <input
              type="text"
              readOnly
              value={refLink}
              className="flex-1 bg-transparent px-2 text-xs text-slate-300 font-mono truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all flex items-center gap-1 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано' : 'Копия'}</span>
            </button>
          </div>
        </div>

        {/* Share in Telegram Button */}
        <button
          onClick={handleShare}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 active:scale-95 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Поделиться в Telegram</span>
        </button>

        {/* Invited Friends List */}
        {invitedFriends.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400">
              Приглашенные друзья:
            </span>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {invitedFriends.map((friend, idx) => (
                <div
                  key={`${friend.id}-${idx}`}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 text-xs"
                >
                  <span className="text-slate-200 font-medium">{friend.name}</span>
                  <span className="text-amber-400 font-mono font-bold">
                    +${friend.bonus.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
