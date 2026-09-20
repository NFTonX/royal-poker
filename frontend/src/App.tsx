import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import {
  TableState,
  TableSummary,
  User,
  ToastNotification,
  Quest,
  Achievement,
  HandRecord,
  Tournament,
  CosmeticItem,
  SeasonPassTier,
  LuckyWheelPrize
} from './types';
import { getTelegramUser, getTelegramWebApp, haptic } from './utils/telegram';
import { sounds } from './utils/sound';
import { Lobby } from './components/Lobby';
import { PokerTable } from './components/PokerTable';
import { ActionPanel } from './components/ActionPanel';
import { ShopModal } from './components/ShopModal';
import { ReferralModal } from './components/ReferralModal';
import { Toast } from './components/Toast';
import { QuestsView } from './components/QuestsView';
import { AchievementsModal } from './components/AchievementsModal';
import { HandHistoryModal } from './components/HandHistoryModal';
import { TournamentsView } from './components/TournamentsView';
import { SeasonPassModal } from './components/SeasonPassModal';
import { CosmeticsModal } from './components/CosmeticsModal';
import { TutorialModal } from './components/TutorialModal';
import { LuckyWheelModal } from './components/LuckyWheelModal';
import { WifiOff, RefreshCw, Crown, ShoppingCart } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);
  const [tableState, setTableState] = useState<TableState | null>(null);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isReferralOpen, setIsReferralOpen] = useState<boolean>(false);
  const [isJoiningSeat, setIsJoiningSeat] = useState<boolean>(false);
  const [isWheelOpen, setIsWheelOpen] = useState<boolean>(false);
  const [spinWheelResult, setSpinWheelResult] = useState<{
    success: boolean;
    prize?: LuckyWheelPrize;
    nextSpinIn: number;
    message: string;
  } | null>(null);
  const [vipModalData, setVipModalData] = useState<{
    tableId?: string;
    tableName?: string;
    minStarsRequired?: number;
    userStars?: number;
    message?: string;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('reconnecting');

  // Gaming Ecosystem States
  const [isQuestsOpen, setIsQuestsOpen] = useState<boolean>(false);
  const [questsData, setQuestsData] = useState<{ daily: Quest[]; weekly: Quest[] }>({ daily: [], weekly: [] });

  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);
  const [achievementsData, setAchievementsData] = useState<{
    achievements: Achievement[];
    unlockedCount: number;
    totalCount: number;
  }>({ achievements: [], unlockedCount: 0, totalCount: 0 });

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [handHistoryData, setHandHistoryData] = useState<HandRecord[]>([]);

  const [isTournamentsOpen, setIsTournamentsOpen] = useState<boolean>(false);
  const [tournamentsList, setTournamentsList] = useState<Tournament[]>([]);

  const [isSeasonPassOpen, setIsSeasonPassOpen] = useState<boolean>(false);
  const [seasonPassData, setSeasonPassData] = useState<{
    seasonNumber: number;
    seasonName: string;
    seasonXp: number;
    tiers: SeasonPassTier[];
  } | null>(null);

  const [isCosmeticsOpen, setIsCosmeticsOpen] = useState<boolean>(false);
  const [cosmeticsData, setCosmeticsData] = useState<{
    items: CosmeticItem[];
    inventory: string[];
    equipped: any;
  } | null>(null);

  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  // Table reactions state
  const [reactions, setReactions] = useState<Record<number, string>>({});
  const [reactionCooldown, setReactionCooldown] = useState<boolean>(false);

  const [referralInfo, setReferralInfo] = useState<{
    referralCount: number;
    referralEarnings: number;
    invitedFriends: any[];
  }>({
    referralCount: 0,
    referralEarnings: 0,
    invitedFriends: []
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const tgUser = getTelegramUser();

  const addToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev.slice(-3), { id, type, message, title }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#0b0e14');
        tg.setBackgroundColor('#0b0e14');
      } catch (e) {
        // ignore on unsupported clients
      }
    }

    // Connect to Socket.io
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      const startParam = tg?.initDataUnsafe?.start_param;
      socket.emit('auth', {
        id: tgUser.id,
        firstName: tgUser.firstName,
        username: tgUser.username,
        startParam
      });
      socket.emit('get_leaderboard');
      socket.emit('get_referral_info');
      socket.emit('get_quests');
      socket.emit('get_achievements');
      socket.emit('get_season_pass');
      socket.emit('get_cosmetics');
      socket.emit('get_tournaments');
      socket.emit('get_hand_history');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('reconnecting');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('referral_reward', (data: { bonus: number; message: string }) => {
      sounds.playWin();
      haptic.success();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });
      addToast('success', data.message, '🎁 Реферальный бонус!');
    });

    socket.on('referral_info', (data: any) => {
      setReferralInfo(data);
    });

    socket.on('auth_success', (data: { user: User; tables: TableSummary[]; activeTableId?: string | null }) => {
      setUser(data.user);
      setTables(data.tables);

      // Auto restore table session if player was seated before disconnect
      if (data.activeTableId) {
        setCurrentTableId(data.activeTableId);
        addToast('info', 'Сессия за столом восстановлена', 'С возвращением!');
      }
    });

    socket.on('tables_list', (list: TableSummary[]) => {
      setTables(list);
    });

    socket.on('user_updated', (updatedUser: User) => {
      setUser(updatedUser);
    });

    socket.on('user_balance_updated', (data: { userId: string; newBalance: number; chipsAdded: number }) => {
      if (data.userId === tgUser.id) {
        setUser(prev => prev ? { ...prev, chips: data.newBalance } : null);
        haptic.success();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        addToast('success', `Вам начислено +$${data.chipsAdded.toLocaleString()} фишек!`, 'Баланс пополнен ⭐️');
      }
    });

    socket.on('table_entered', (data: { tableId: string }) => {
      setCurrentTableId(data.tableId);
    });

    socket.on('joined_table', (data: { tableId: string; seatIndex: number; buyIn: number }) => {
      setIsJoiningSeat(false);
      haptic.success();
      addToast('success', `Вы заняли место #${data.seatIndex + 1} со стеком $${data.buyIn.toLocaleString()}`);
    });

    socket.on('vip_required', (data: { tableId: string; tableName: string; minStarsRequired: number; userStars: number; message: string }) => {
      setIsJoiningSeat(false);
      haptic.warning();
      setVipModalData(data);
    });

    socket.on('left_table', () => {
      setCurrentTableId(null);
      setTableState(null);
      addToast('info', 'Вы покинули стол и вернулись в лобби');
    });

    socket.on('table_state', (state: TableState) => {
      setTableState(state);

      // Trigger confetti if current player won
      if (state.handResult && state.handResult.winners.length > 0) {
        const iWon = state.handResult.winners.some(w => w.playerId === tgUser.id);
        if (iWon) {
          haptic.success();
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 }
          });
        }
      }
    });

    socket.on('leaderboard_data', (data: any[]) => {
      setLeaderboard(data);
    });

    // Gaming Ecosystem Socket Events
    socket.on('quests_data', (data: { daily: Quest[]; weekly: Quest[] }) => {
      setQuestsData(data);
    });

    socket.on('quest_claim_result', (res: { success: boolean; message: string; rewardChips: number; rewardXp: number }) => {
      if (res.success) {
        haptic.success();
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        addToast('success', res.message, 'Награда за квест 🎁');
      } else {
        haptic.warning();
        addToast('warning', res.message);
      }
    });

    socket.on('achievements_data', (data: any) => {
      setAchievementsData(data);
    });

    socket.on('season_pass_data', (data: any) => {
      setSeasonPassData(data);
    });

    socket.on('season_reward_result', (res: { success: boolean; message: string }) => {
      if (res.success) {
        haptic.success();
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
        addToast('success', res.message, 'Сезонный пропуск 👑');
      } else {
        haptic.warning();
        addToast('warning', res.message);
      }
    });

    socket.on('cosmetics_data', (data: any) => {
      setCosmeticsData(data);
    });

    socket.on('buy_cosmetic_result', (res: { success: boolean; message: string }) => {
      if (res.success) {
        haptic.success();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        addToast('success', res.message, 'Покупка успешна ✨');
      } else {
        haptic.warning();
        addToast('warning', res.message);
      }
    });

    socket.on('hand_history_data', (data: HandRecord[]) => {
      setHandHistoryData(data);
    });

    socket.on('tournaments_list', (data: Tournament[]) => {
      setTournamentsList(data);
    });

    socket.on('tournament_action_result', (res: { success: boolean; message: string }) => {
      if (res.success) {
        haptic.success();
        addToast('success', res.message, 'Турнир 🏟');
      } else {
        haptic.warning();
        addToast('warning', res.message);
      }
    });

    // Floating reactions
    socket.on('player_reaction', (data: { seatIndex: number; emoji: string; playerName: string }) => {
      setReactions(prev => ({ ...prev, [data.seatIndex]: data.emoji }));
      // Clear reaction bubble after 2.5 seconds
      setTimeout(() => {
        setReactions(prev => {
          const next = { ...prev };
          delete next[data.seatIndex];
          return next;
        });
      }, 2500);
    });

    // XP gained and level up
    socket.on('xp_gained', (data: { amount: number; newLevel: number; leveledUp: boolean; rewardChips: number }) => {
      if (data.leveledUp) {
        haptic.success();
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } });
        addToast('success', `Поздравляем! Вы достигли уровня ${data.newLevel}! Бонус: +$${data.rewardChips.toLocaleString()} фишек!`, 'НОВЫЙ УРОВЕНЬ ⭐️');
      }
    });

    socket.on('daily_bonus_result', (res: { success: boolean; message: string; chips: number }) => {
      if (res.success) {
        haptic.success();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        addToast('success', res.message, 'Ежедневный бонус 🎁');
      } else {
        haptic.warning();
        addToast('warning', res.message);
      }
    });

    socket.on('spin_wheel_result', (res: { success: boolean; prize?: LuckyWheelPrize; nextSpinIn: number; message: string }) => {
      setSpinWheelResult(res);
      if (res.success && res.prize) {
        haptic.success();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        addToast('success', res.message, 'Колесо Фортуны 🎡');
      } else if (!res.success) {
        haptic.warning();
        addToast('warning', res.message);
      }
    });

    socket.on('ton_deposit_success', (data: { balance: number; message: string }) => {
      haptic.success();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
      addToast('success', data.message, 'TON Депозит 💎');
      setUser(prev => prev ? { ...prev, tonBalance: data.balance } : null);
    });

    socket.on('ton_withdraw_success', (data: { balance: number; message: string }) => {
      haptic.success();
      addToast('success', data.message, 'TON Вывод 💎');
      setUser(prev => prev ? { ...prev, tonBalance: data.balance } : null);
    });

    socket.on('player_busted', (data: { message: string }) => {
      haptic.warning();
      addToast('warning', data.message, 'Фишки закончились ⭐️');
      setIsShopOpen(true);
    });

    socket.on('action_failed', (data: { message: string }) => {
      haptic.warning();
      addToast('warning', data.message);
    });

    socket.on('error', (err: { message: string }) => {
      setIsJoiningSeat(false);
      haptic.error();
      addToast('error', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [tgUser.id, tgUser.firstName, tgUser.username, addToast]);

  const handleSelectTable = (tableId: string) => {
    setCurrentTableId(tableId);
    socketRef.current?.emit('enter_table', { tableId });
  };

  const handleJoinSeat = (seatIndex: number, buyIn: number) => {
    if (!currentTableId) return;
    setIsJoiningSeat(true);
    socketRef.current?.emit('join_table', {
      tableId: currentTableId,
      seatIndex,
      buyIn
    });
  };

  const handleLeaveTable = () => {
    if (!currentTableId) return;
    socketRef.current?.emit('leave_table', { tableId: currentTableId });
    setCurrentTableId(null);
    setTableState(null);
    socketRef.current?.emit('get_tables');
  };

  const handleTableAction = (
    action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN',
    amount?: number
  ) => {
    if (!currentTableId) return;

    if (action === 'CHECK') {
      sounds.playCheck();
    } else if (action === 'FOLD') {
      sounds.playFold();
    } else {
      sounds.playChip();
    }

    socketRef.current?.emit('table_action', {
      tableId: currentTableId,
      action,
      amount
    });
  };

  const handleSendReaction = (emoji: string) => {
    if (!currentTableId || reactionCooldown) return;
    setReactionCooldown(true);
    socketRef.current?.emit('send_table_reaction', {
      tableId: currentTableId,
      emoji
    });
    setTimeout(() => {
      setReactionCooldown(false);
    }, 3000);
  };

  const handleOpenReferral = () => {
    socketRef.current?.emit('get_referral_info');
    setIsReferralOpen(true);
  };

  const handleClaimDailyBonus = () => {
    socketRef.current?.emit('claim_daily_bonus');
  };

  const handleDepositTon = (amount: number) => {
    socketRef.current?.emit('deposit_ton', { amount });
  };

  const handleWithdrawTon = (amount: number, address: string) => {
    socketRef.current?.emit('withdraw_ton', { amount, address });
  };

  const handleSpinWheel = () => {
    socketRef.current?.emit('spin_wheel');
  };

  const handleReconnect = () => {
    haptic.medium();
    socketRef.current?.connect();
  };

  // Find current player in table seats
  const myPlayer = tableState?.seats.find(p => p?.id === tgUser.id) || null;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0e14] text-slate-100 overflow-hidden font-['Outfit',sans-serif]">
      {/* Toast Notification Layer */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Disconnection Banner */}
      {connectionStatus !== 'connected' && (
        <div className="bg-amber-950/90 border-b border-amber-500/40 px-3 py-1.5 flex items-center justify-between text-xs text-amber-200 z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              {connectionStatus === 'reconnecting'
                ? 'Восстановление связи с сервером...'
                : 'Соединение потеряно'}
            </span>
          </div>
          {connectionStatus === 'disconnected' && (
            <button
              onClick={handleReconnect}
              className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Повторить</span>
            </button>
          )}
        </div>
      )}

      {currentTableId && tableState ? (
        <div className="w-full h-full flex flex-col justify-between">
          <PokerTable
            tableState={tableState}
            currentUserId={tgUser.id}
            userChips={user?.chips || 0}
            userTonBalance={user?.tonBalance || 0}
            onLeave={handleLeaveTable}
            onJoin={handleJoinSeat}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenReferral={handleOpenReferral}
            isJoining={isJoiningSeat}
            reactions={reactions}
            onSendReaction={handleSendReaction}
            reactionCooldown={reactionCooldown}
          />

          {/* Action controls when seated and active */}
          {myPlayer && (
            <ActionPanel
              tableState={tableState}
              myPlayer={myPlayer}
              onAction={handleTableAction}
            />
          )}
        </div>
      ) : (
        <Lobby
          user={user}
          tables={tables}
          onSelectTable={handleSelectTable}
          onOpenShop={() => setIsShopOpen(true)}
          onClaimDailyBonus={handleClaimDailyBonus}
          leaderboard={leaderboard}
          referralCount={referralInfo.referralCount}
          referralEarnings={referralInfo.referralEarnings}
          invitedFriends={referralInfo.invitedFriends}
          onOpenWheel={() => setIsWheelOpen(true)}
          onDepositTon={handleDepositTon}
          onWithdrawTon={handleWithdrawTon}
          onOpenVipModal={(table) => {
            haptic.warning();
            setVipModalData({
              tableId: table.id,
              tableName: table.name,
              minStarsRequired: table.minStarsRequired || 100,
              userStars: user?.totalStarsPurchased || 0,
              message: `Этот эксклюзивный VIP-стол доступен только игрокам, купившим фишки минимум на ${table.minStarsRequired || 100} ⭐️ Telegram Stars.`
            });
          }}
          onSuccessPurchase={() => {
            socketRef.current?.emit('auth', {
              id: tgUser.id,
              firstName: tgUser.firstName,
              username: tgUser.username
            });
          }}
          onOpenTournaments={() => {
            socketRef.current?.emit('get_tournaments');
            setIsTournamentsOpen(true);
          }}
          onOpenQuests={() => {
            socketRef.current?.emit('get_quests');
            setIsQuestsOpen(true);
          }}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenHistory={() => {
            socketRef.current?.emit('get_hand_history');
            setIsHistoryOpen(true);
          }}
          onOpenAchievements={() => {
            socketRef.current?.emit('get_achievements');
            setIsAchievementsOpen(true);
          }}
          onOpenCosmetics={() => {
            socketRef.current?.emit('get_cosmetics');
            setIsCosmeticsOpen(true);
          }}
          onOpenSeasonPass={() => {
            socketRef.current?.emit('get_season_pass');
            setIsSeasonPassOpen(true);
          }}
        />
      )}

      {/* Quests Modal */}
      {isQuestsOpen && (
        <QuestsView
          quests={questsData}
          onClaim={(questId) => socketRef.current?.emit('claim_quest', { questId })}
          onClose={() => setIsQuestsOpen(false)}
        />
      )}

      {/* Achievements Modal */}
      {isAchievementsOpen && (
        <AchievementsModal
          achievements={achievementsData.achievements}
          unlockedCount={achievementsData.unlockedCount}
          totalCount={achievementsData.totalCount}
          onClose={() => setIsAchievementsOpen(false)}
        />
      )}

      {/* Hand History & Replayer Modal */}
      {isHistoryOpen && (
        <HandHistoryModal
          hands={handHistoryData}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      {/* Tournaments Modal */}
      {isTournamentsOpen && (
        <TournamentsView
          tournaments={tournamentsList}
          user={user}
          onJoin={(tournamentId) => socketRef.current?.emit('join_tournament', { tournamentId })}
          onLeave={(tournamentId) => socketRef.current?.emit('leave_tournament', { tournamentId })}
          onFillBots={(tournamentId) => socketRef.current?.emit('fill_tournament_bots', { tournamentId })}
          onEnterTable={(tableId) => {
            setIsTournamentsOpen(false);
            handleSelectTable(tableId);
          }}
          onClose={() => setIsTournamentsOpen(false)}
        />
      )}

      {/* Season Pass Modal */}
      {isSeasonPassOpen && (
        <SeasonPassModal
          seasonData={seasonPassData}
          onClaimTier={(tier) => socketRef.current?.emit('claim_season_tier', { tier })}
          onClose={() => setIsSeasonPassOpen(false)}
        />
      )}

      {/* Cosmetics & Wardrobe Modal */}
      {isCosmeticsOpen && (
        <CosmeticsModal
          cosmetics={cosmeticsData}
          userChips={user?.chips || 0}
          onBuy={(itemId) => socketRef.current?.emit('buy_cosmetic', { itemId })}
          onEquip={(category, itemId) => socketRef.current?.emit('equip_cosmetic', { category, itemId })}
          onClose={() => setIsCosmeticsOpen(false)}
        />
      )}

      {/* Tutorial / Hand Rankings Modal */}
      {isTutorialOpen && (
        <TutorialModal onClose={() => setIsTutorialOpen(false)} />
      )}

      {/* Telegram Stars Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        userId={tgUser.id}
        onSuccessPurchase={() => {
          socketRef.current?.emit('auth', {
            id: tgUser.id,
            firstName: tgUser.firstName,
            username: tgUser.username
          });
        }}
      />

      {/* Referral Program Modal */}
      <ReferralModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        userId={tgUser.id}
        referralCount={referralInfo.referralCount}
        referralEarnings={referralInfo.referralEarnings}
        invitedFriends={referralInfo.invitedFriends}
      />

      {/* Daily Lucky Wheel Modal */}
      <LuckyWheelModal
        isOpen={isWheelOpen}
        onClose={() => {
          setIsWheelOpen(false);
          setSpinWheelResult(null);
        }}
        onSpin={handleSpinWheel}
        lastSpinTime={user?.lastSpinTime}
        spinResult={spinWheelResult}
      />

      {/* VIP Access Required Modal */}
      {vipModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 flex flex-col items-center text-center gap-4 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] bg-gradient-to-b from-slate-900 via-slate-950 to-black relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <Crown className="w-9 h-9 text-slate-950 fill-slate-950" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-black tracking-tight text-white font-['Cinzel']">
                VIP ДОСТУП ТРЕБУЕТСЯ
              </h3>
              <p className="text-xs text-amber-300 font-bold">
                {vipModalData.tableName || 'VIP Стол'}
              </p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-white/[0.08] w-full flex flex-col gap-2">
              <p className="text-xs text-slate-300 leading-relaxed">
                {vipModalData.message || 'Для посадки за этот стол необходимо купить фишки минимум на 100 ⭐️ Telegram Stars.'}
              </p>
              <div className="flex items-center justify-between px-2 pt-1 border-t border-white/[0.06] text-xs font-mono">
                <span className="text-slate-400">Куплено звёзд:</span>
                <span className="font-bold text-amber-400">
                  {vipModalData.userStars !== undefined ? vipModalData.userStars : (user?.totalStarsPurchased || 0)} / {vipModalData.minStarsRequired || 100} ⭐️
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                onClick={() => {
                  haptic.medium();
                  setVipModalData(null);
                  setIsShopOpen(true);
                }}
                className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Купить фишки (В магазин)</span>
              </button>
              <button
                onClick={() => {
                  haptic.light();
                  setVipModalData(null);
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/[0.06] active:scale-95 transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
