import React, { useState } from 'react';
import { TableSummary, User } from '../types';
import { ChipStack } from './ChipStack';
import { TablesView } from './TablesView';
import { WalletView } from './WalletView';
import { ClubView } from './ClubView';
import { LeaderboardView } from './LeaderboardView';
import { ProfileView } from './ProfileView';
import { sounds } from '../utils/sound';
import { haptic } from '../utils/telegram';
import {
  Play,
  ShoppingCart,
  Users,
  Trophy,
  User as UserIcon,
  Volume2,
  VolumeX,
  Plus,
  Crown
} from 'lucide-react';

interface LobbyProps {
  user: User | null;
  tables: TableSummary[];
  onSelectTable: (tableId: string) => void;
  onOpenShop: () => void;
  onClaimDailyBonus: () => void;
  leaderboard: { id: string; name: string; chips: number; handsWon: number }[];
  referralCount?: number;
  referralEarnings?: number;
  invitedFriends?: { id: string; name: string; date: number; bonus: number }[];
  onSuccessPurchase?: () => void;
  onOpenTournaments: () => void;
  onOpenQuests: () => void;
  onOpenTutorial: () => void;
  onOpenHistory: () => void;
  onOpenAchievements: () => void;
  onOpenCosmetics: () => void;
  onOpenSeasonPass: () => void;
  onOpenVipModal?: (table: TableSummary) => void;
  onOpenWheel?: () => void;
  onDepositTon?: (amount: number, boc?: string) => void;
  onWithdrawTon?: (amount: number, address: string) => void;
}

export type LobbyTab = 'tables' | 'wallet' | 'club' | 'leaderboard' | 'profile';

export const Lobby: React.FC<LobbyProps> = ({
  user,
  tables,
  onSelectTable,
  onOpenShop,
  onClaimDailyBonus,
  leaderboard,
  referralCount = 0,
  referralEarnings = 0,
  invitedFriends = [],
  onSuccessPurchase,
  onOpenTournaments,
  onOpenQuests,
  onOpenTutorial,
  onOpenHistory,
  onOpenAchievements,
  onOpenCosmetics,
  onOpenSeasonPass,
  onOpenVipModal,
  onOpenWheel,
  onDepositTon,
  onWithdrawTon
}) => {
  const [activeTab, setActiveTab] = useState<LobbyTab>('tables');
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted());

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    haptic.light();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#07090e] text-slate-100 overflow-hidden select-none relative">
      
      {/* Top Header Bar */}
      <header className="px-4 py-2.5 bg-slate-950/90 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between z-30 shadow-md">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center">
            <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-sm tracking-wider font-['Cinzel'] text-amber-300">
              ROYAL POKER
            </span>
            <span className="text-[9px] text-slate-400 font-semibold tracking-widest">
              CLUB
            </span>
          </div>
        </div>

        {/* Right Side: Level, Chips & Sound Toggle */}
        <div className="flex items-center gap-2">
          {/* Level Pill */}
          <button
            onClick={() => {
              haptic.light();
              onOpenSeasonPass();
            }}
            className="flex items-center gap-1 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/40 rounded-full py-1 px-2.5 shadow-md active:scale-95 transition"
            title="Сезонный пропуск и уровень"
          >
            <span className="text-[10px]">⭐️</span>
            <span className="text-[11px] font-black text-purple-300">Ур. {user?.level || 1}</span>
          </button>

          {/* Quick Chip Pill */}
          <button
            onClick={() => {
              haptic.light();
              setActiveTab('wallet');
            }}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 rounded-full py-1 pl-2.5 pr-1.5 shadow-md transition-all active:scale-95 group"
          >
            <ChipStack amount={user?.chips || 0} size="sm" showLabel={true} />
            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 group-hover:scale-110 transition-transform">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </button>

          {/* TON Balance Pill */}
          <button
            onClick={() => {
              haptic.light();
              setActiveTab('wallet');
            }}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800/90 border border-sky-500/40 rounded-full py-1 pl-2.5 pr-1.5 shadow-md transition-all active:scale-95 group"
            title="Баланс TON"
          >
            <span className="text-xs">💎</span>
            <span className="text-xs font-black text-sky-300">{(user?.tonBalance || 0).toFixed(2)}</span>
            <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-slate-950 group-hover:scale-110 transition-transform">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/[0.06] active:scale-95 transition-all"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Quick Action Feature Buttons Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none bg-slate-950/60 border-b border-white/[0.04] shrink-0">
        <button
          onClick={() => {
            haptic.light();
            onOpenWheel?.();
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-pink-500/30 to-purple-600/30 border border-pink-500/50 text-pink-300 text-xs font-black active:scale-95 transition whitespace-nowrap shadow-sm shadow-pink-500/20 animate-pulse"
        >
          <span className="text-sm">🎡</span>
          <span>Колесо Фортуны</span>
        </button>
        <button
          onClick={onOpenTournaments}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 text-xs font-bold active:scale-95 transition whitespace-nowrap shadow-sm"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Турниры</span>
        </button>
        <button
          onClick={onOpenSeasonPass}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-600/20 border border-purple-500/40 text-purple-300 text-xs font-bold active:scale-95 transition whitespace-nowrap shadow-sm"
        >
          <Crown className="w-3.5 h-3.5 text-purple-400" />
          <span>Сезон 1</span>
        </button>
        <button
          onClick={onOpenQuests}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 text-xs font-semibold active:scale-95 transition whitespace-nowrap"
        >
          <span>🎯</span>
          <span>Квесты</span>
        </button>
        <button
          onClick={onOpenCosmetics}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 text-xs font-semibold active:scale-95 transition whitespace-nowrap"
        >
          <span>🎨</span>
          <span>Кастомизация</span>
        </button>
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 text-xs font-semibold active:scale-95 transition whitespace-nowrap"
        >
          <span>📜</span>
          <span>История</span>
        </button>
        <button
          onClick={onOpenAchievements}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 text-xs font-semibold active:scale-95 transition whitespace-nowrap"
        >
          <span>🎖</span>
          <span>Достижения</span>
        </button>
        <button
          onClick={onOpenTutorial}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 text-xs font-semibold active:scale-95 transition whitespace-nowrap"
        >
          <span>🎓</span>
          <span>Обучение</span>
        </button>
      </div>

      {/* Main Tab Content Arena */}
      <main className="flex-1 min-h-0 overflow-y-auto relative scroll-touch overscroll-contain">
        {activeTab === 'tables' && (
          <TablesView
            tables={tables}
            onSelectTable={onSelectTable}
            userChips={user?.chips || 0}
            userTonBalance={user?.tonBalance || 0}
            totalStarsPurchased={user?.totalStarsPurchased || 0}
            onOpenShop={() => setActiveTab('wallet')}
            onOpenTonWallet={() => setActiveTab('wallet')}
            onOpenVipModal={onOpenVipModal}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletView
            user={user}
            onClaimDailyBonus={onClaimDailyBonus}
            onSuccessPurchase={onSuccessPurchase}
            onDepositTon={onDepositTon}
            onWithdrawTon={onWithdrawTon}
          />
        )}

        {activeTab === 'club' && (
          <ClubView
            userId={user?.id || '---'}
            referralCount={referralCount}
            referralEarnings={referralEarnings}
            invitedFriends={invitedFriends}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            leaderboard={leaderboard}
            currentUserId={user?.id || ''}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            onOpenShop={() => setActiveTab('wallet')}
            onClaimDailyBonus={onClaimDailyBonus}
            referralEarnings={referralEarnings}
            referralCount={referralCount}
            onOpenHistory={onOpenHistory}
            onOpenAchievements={onOpenAchievements}
            onOpenCosmetics={onOpenCosmetics}
            onOpenSeasonPass={onOpenSeasonPass}
          />
        )}
      </main>

      {/* Bottom Navigation Bar (Fixed for thumb access) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 safe-bottom flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        {[
          { id: 'tables', label: 'Столы', icon: Play },
          { id: 'wallet', label: 'Магазин', icon: ShoppingCart },
          { id: 'club', label: 'Клуб', icon: Users },
          { id: 'leaderboard', label: 'Рейтинг', icon: Trophy },
          { id: 'profile', label: 'Профиль', icon: UserIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                haptic.light();
                setActiveTab(tab.id as LobbyTab);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-amber-500/15' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
};
