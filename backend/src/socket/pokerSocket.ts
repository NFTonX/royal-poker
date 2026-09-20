import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../db/database.js';
import { PokerTable } from '../poker/table.js';
import { TelegramPokerBot } from '../bot/telegram.js';
import { TournamentManager } from '../poker/tournament.js';
import { HandRecord, Player } from '../types/poker.js';

export class TableManager {
  private io: SocketIOServer;
  private tables: Map<string, PokerTable> = new Map();
  private socketUserMap: Map<string, { userId: string; name: string; username: string }> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private bot: TelegramPokerBot;
  private tournamentManager: TournamentManager;
  private reactionCooldowns: Map<string, number> = new Map();

  constructor(io: SocketIOServer, bot: TelegramPokerBot) {
    this.io = io;
    this.bot = bot;
    this.tournamentManager = new TournamentManager();
    this.tournamentManager.setOnStateChange(() => {
      this.io.emit('tournaments_list', this.tournamentManager.getTournaments());
    });
    this.initDefaultTables();
    this.setupSocketHandlers();

    // Listen for payment success from bot to update connected user balances
    this.bot.setOnPaymentSuccess((userId, chipsAdded) => {
      const user = db.getUser(userId);
      this.io.emit('user_balance_updated', {
        userId,
        newBalance: user?.chips || 0,
        chipsAdded
      });
    });
  }

  private initDefaultTables(): void {
    const tableConfigs: any[] = [
      // --- 10 Регулярных столов (за фишки) ---
      { id: 'table_chips_1', name: '🥉 Новички #1', smallBlind: 10, bigBlind: 20, minBuyIn: 400, maxBuyIn: 2000, currency: 'CHIPS' },
      { id: 'table_chips_2', name: '🥉 Новички #2', smallBlind: 15, bigBlind: 30, minBuyIn: 600, maxBuyIn: 3000, currency: 'CHIPS' },
      { id: 'table_chips_3', name: '🥉 Техасский Ветерок', smallBlind: 25, bigBlind: 50, minBuyIn: 1000, maxBuyIn: 5000, currency: 'CHIPS' },
      { id: 'table_chips_4', name: '🔹 Бронзовый Клуб', smallBlind: 50, bigBlind: 100, minBuyIn: 2000, maxBuyIn: 10000, currency: 'CHIPS' },
      { id: 'table_chips_5', name: '🔹 Лас-Вегас Экспресс', smallBlind: 75, bigBlind: 150, minBuyIn: 3000, maxBuyIn: 15000, currency: 'CHIPS' },
      { id: 'table_chips_6', name: '🥈 Серебряный Стол', smallBlind: 100, bigBlind: 200, minBuyIn: 4000, maxBuyIn: 20000, currency: 'CHIPS' },
      { id: 'table_chips_7', name: '🥈 Невада Классик', smallBlind: 250, bigBlind: 500, minBuyIn: 10000, maxBuyIn: 50000, currency: 'CHIPS' },
      { id: 'table_chips_8', name: '🥇 Золотой Стол', smallBlind: 500, bigBlind: 1000, minBuyIn: 20000, maxBuyIn: 100000, currency: 'CHIPS' },
      { id: 'table_chips_9', name: '🥇 Монте-Карло', smallBlind: 1000, bigBlind: 2000, minBuyIn: 40000, maxBuyIn: 200000, currency: 'CHIPS' },
      { id: 'table_chips_10', name: '💎 Хайроллер Арена', smallBlind: 2500, bigBlind: 5000, minBuyIn: 100000, maxBuyIn: 500000, currency: 'CHIPS' },

      // --- 5 VIP Столов (за Telegram Stars: 10, 50, 100, 250, 500) ---
      { id: 'table_vip_bronze', name: '👑 VIP Bronze (10 ⭐️)', smallBlind: 250, bigBlind: 500, minBuyIn: 10000, maxBuyIn: 50000, minStarsRequired: 10, isVip: true, currency: 'CHIPS' },
      { id: 'table_vip_silver', name: '👑 VIP Silver (50 ⭐️)', smallBlind: 500, bigBlind: 1000, minBuyIn: 20000, maxBuyIn: 100000, minStarsRequired: 50, isVip: true, currency: 'CHIPS' },
      { id: 'table_vip_gold', name: '👑 VIP Gold (100 ⭐️)', smallBlind: 1000, bigBlind: 2000, minBuyIn: 40000, maxBuyIn: 200000, minStarsRequired: 100, isVip: true, currency: 'CHIPS' },
      { id: 'table_vip_platinum', name: '👑 VIP Platinum (250 ⭐️)', smallBlind: 2500, bigBlind: 5000, minBuyIn: 100000, maxBuyIn: 500000, minStarsRequired: 250, isVip: true, currency: 'CHIPS' },
      { id: 'table_vip_diamond', name: '👑 VIP Royal Diamond (500 ⭐️)', smallBlind: 5000, bigBlind: 10000, minBuyIn: 200000, maxBuyIn: 1000000, minStarsRequired: 500, isVip: true, currency: 'CHIPS' },

      // --- 10 Crypto Столов (прямая игра на TON, мин. бай-ин 2 TON) ---
      { id: 'table_ton_1', name: '💎 TON Micro #1', smallBlind: 0.02, bigBlind: 0.04, minBuyIn: 2, maxBuyIn: 10, currency: 'TON' },
      { id: 'table_ton_2', name: '💎 TON Micro #2', smallBlind: 0.02, bigBlind: 0.04, minBuyIn: 2, maxBuyIn: 10, currency: 'TON' },
      { id: 'table_ton_3', name: '💎 TON Low #1', smallBlind: 0.05, bigBlind: 0.10, minBuyIn: 5, maxBuyIn: 25, currency: 'TON' },
      { id: 'table_ton_4', name: '💎 TON Low #2', smallBlind: 0.05, bigBlind: 0.10, minBuyIn: 5, maxBuyIn: 25, currency: 'TON' },
      { id: 'table_ton_5', name: '💎 TON Mid #1', smallBlind: 0.10, bigBlind: 0.20, minBuyIn: 10, maxBuyIn: 50, currency: 'TON' },
      { id: 'table_ton_6', name: '💎 TON Mid #2', smallBlind: 0.10, bigBlind: 0.20, minBuyIn: 10, maxBuyIn: 50, currency: 'TON' },
      { id: 'table_ton_7', name: '💎 TON High #1', smallBlind: 0.25, bigBlind: 0.50, minBuyIn: 25, maxBuyIn: 125, currency: 'TON' },
      { id: 'table_ton_8', name: '💎 TON High #2', smallBlind: 0.50, bigBlind: 1.00, minBuyIn: 50, maxBuyIn: 250, currency: 'TON' },
      { id: 'table_ton_9', name: '💎 TON Whale #1', smallBlind: 1.00, bigBlind: 2.00, minBuyIn: 100, maxBuyIn: 500, currency: 'TON' },
      { id: 'table_ton_10', name: '💎 TON Royal Whale #2', smallBlind: 2.50, bigBlind: 5.00, minBuyIn: 250, maxBuyIn: 1250, currency: 'TON' }
    ];

    for (const cfg of tableConfigs) {
      const table = new PokerTable(cfg);
      table.setOnStateChange(() => {
        this.broadcastTableState(table);
      });

      table.setOnHandFinished((handRecord, players) => {
        this.handleHandFinished(table, handRecord, players);
      });

      // Handle players running out of chips
      table.setOnPlayerBusted((player) => {
        // Refund any leftover chips to DB
        if (player.chips > 0) {
          if (table.currency === 'TON') {
            db.updateTonBalance(player.id, player.chips);
          } else {
            db.updateChips(player.id, player.chips);
          }
        }
        // Notify the player socket
        for (const [socketId, info] of this.socketUserMap.entries()) {
          if (info.userId === player.id) {
            const s = this.io.sockets.sockets.get(socketId);
            if (s) {
              const msg = table.currency === 'TON'
                ? 'У вас закончился стек за TON-столом.'
                : 'У вас закончились фишки за столом. Пополните баланс за Telegram Stars, чтобы занять место!';
              s.emit('player_busted', { message: msg });
              s.emit('user_updated', db.getUser(player.id));
            }
          }
        }
      });

      this.tables.set(table.id, table);
    }
  }

  private handleHandFinished(table: PokerTable, handRecord: HandRecord, players: Player[]): void {
    for (const player of players) {
      if (player.isBot) continue;

      const wonEntry = handRecord.winners.find(w => w.playerId === player.id);
      const isWin = !!wonEntry;
      const result = isWin ? 'WIN' : (player.status === 'FOLDED' ? 'FOLD' : 'LOSS');
      const potWon = wonEntry ? wonEntry.amount : 0;
      const netChips = isWin ? potWon - player.currentBet : -player.currentBet;

      const userHandRecord: HandRecord = {
        ...handRecord,
        myHoleCards: [...player.cards],
        result,
        netChips,
        pot: handRecord.pot
      };

      // 1. Record in DB (stats, quests, achievements, history)
      db.trackHandResult(player.id, userHandRecord, isWin, netChips, handRecord.pot);

      // 2. Streaks
      db.updateStreak(player.id, isWin);

      // 3. XP system
      let xpEarned = 25; // Hand played
      if (isWin) xpEarned += 50; // Hand won
      if (handRecord.communityCards.length === 5) xpEarned += 20; // Reached river/showdown
      const xpResult = db.addXp(player.id, xpEarned);

      // 4. Notify player sockets
      for (const [socketId, info] of this.socketUserMap.entries()) {
        if (info.userId === player.id) {
          const s = this.io.sockets.sockets.get(socketId);
          if (s) {
            s.emit('hand_finished_record', userHandRecord);
            s.emit('xp_gained', {
              amount: xpEarned,
              newXp: xpResult.newXp,
              newLevel: xpResult.newLevel,
              leveledUp: xpResult.leveledUp,
              rewardChips: xpResult.rewardChips
            });
            s.emit('user_updated', db.getUser(player.id));
          }
        }
      }
    }
  }

  private broadcastTableState(table: PokerTable): void {
    // We send customized state to each socket in the room so hole cards are masked
    const room = `table_${table.id}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    if (!socketsInRoom) return;

    for (const socketId of socketsInRoom) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket) continue;

      const user = this.socketUserMap.get(socketId);
      const state = table.getState(user?.userId);
      socket.emit('table_state', state);
    }
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      // User authentication / initial sync
      socket.on('auth', (data: { id: string; firstName: string; username?: string; startParam?: string }) => {
        if (!data || !data.id) return;

        const userId = data.id.toString();
        const user = db.getOrCreateUser(userId, data.firstName, data.username);
        this.socketUserMap.set(socket.id, {
          userId,
          name: data.firstName || 'Игрок',
          username: data.username || ''
        });

        // Cancel any pending disconnect timer if player reconnected within grace period
        const existingTimer = this.disconnectTimers.get(userId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          this.disconnectTimers.delete(userId);
        }

        // Check if user is currently seated at any table
        let activeTableId: string | null = null;
        let activeSeatIndex: number = -1;
        for (const table of this.tables.values()) {
          const seated = table.seats.find(p => p?.id === userId);
          if (seated) {
            activeTableId = table.id;
            activeSeatIndex = seated.seatIndex;
            table.setPlayerDisconnected(userId, false);
            socket.join(`table_${table.id}`);
            break;
          }
        }

        // Process referral if startParam present
        if (data.startParam && typeof data.startParam === 'string' && data.startParam.startsWith('ref_')) {
          const referrerId = data.startParam.replace('ref_', '').trim();
          const refResult = db.processReferral(userId, referrerId);
          if (refResult.success) {
            socket.emit('referral_reward', {
              bonus: refResult.bonusUser,
              referrerName: refResult.referrerName,
              message: refResult.message
            });
            // Update referrer in real-time if connected
            for (const [sId, info] of this.socketUserMap.entries()) {
              if (info.userId === referrerId) {
                const s = this.io.sockets.sockets.get(sId);
                if (s) {
                  s.emit('referral_reward', {
                    bonus: refResult.bonusReferrer,
                    message: `Игрок ${data.firstName} зашел по вашей ссылке! Вам начислено +${refResult.bonusReferrer.toLocaleString()} фишек!`
                  });
                  s.emit('user_updated', db.getUser(referrerId));
                }
              }
            }
          }
        }

        socket.emit('auth_success', {
          user: db.getUser(userId) || user,
          tables: this.getTableList(),
          activeTableId,
          activeSeatIndex
        });

        if (activeTableId) {
          const table = this.tables.get(activeTableId);
          if (table) {
            socket.emit('table_state', table.getState(userId));
            this.broadcastTableState(table);
          }
        }
      });

      // Get referral info
      socket.on('get_referral_info', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        const user = db.getUser(userInfo.userId);
        socket.emit('referral_info', {
          referralCount: user?.referralCount || 0,
          referralEarnings: user?.referralEarnings || 0,
          invitedFriends: user?.invitedFriends || [],
          referralLink: `https://t.me/${process.env.BOT_USERNAME || 'RoyalsPokerBot'}?start=ref_${userInfo.userId}`
        });
      });

      // Get list of tables
      socket.on('get_tables', () => {
        socket.emit('tables_list', this.getTableList());
      });

      // Enter table as spectator/viewer
      socket.on('enter_table', (data: { tableId: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        const table = this.tables.get(data.tableId);
        if (!table) {
          socket.emit('error', { message: 'Стол не найден' });
          return;
        }

        socket.join(`table_${table.id}`);
        socket.emit('table_entered', { tableId: table.id });
        socket.emit('table_state', table.getState(userInfo?.userId));
      });

      // Join a seat with a chosen buy-in
      socket.on('join_table', (data: { tableId: string; seatIndex: number; buyIn: number }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) {
          socket.emit('error', { message: 'Требуется авторизация' });
          return;
        }

        const table = this.tables.get(data.tableId);
        if (!table) {
          socket.emit('error', { message: 'Стол не найден' });
          return;
        }

        const user = db.getUser(userInfo.userId);
        if (!user) return;

        // Check VIP table requirement: min 100 Stars purchased
        if (table.minStarsRequired && table.minStarsRequired > 0) {
          const totalStars = db.getUserTotalStarsPurchased(userInfo.userId);
          if (totalStars < table.minStarsRequired) {
            socket.emit('vip_required', {
              tableId: table.id,
              tableName: table.name,
              minStarsRequired: table.minStarsRequired,
              userStars: totalStars,
              message: `Этот VIP-стол доступен только игрокам, купившим фишки минимум на ${table.minStarsRequired} ⭐️ Telegram Stars. Ваша сумма покупок: ${totalStars} ⭐️.`
            });
            return;
          }
        }

        // Validate seat index
        if (data.seatIndex < 0 || data.seatIndex >= table.maxSeats) {
          socket.emit('error', { message: 'Некорректное место за столом' });
          return;
        }

        // Validate seat is empty
        if (table.seats[data.seatIndex] !== null) {
          socket.emit('error', { message: 'Это место уже занято' });
          return;
        }

        // Validate player not already seated
        if (table.seats.some(p => p?.id === userInfo.userId)) {
          socket.emit('error', { message: 'Вы уже сидите за этим столом' });
          return;
        }

        const isTonTable = table.currency === 'TON';
        const buyIn = isTonTable ? parseFloat(data.buyIn.toFixed(4)) : Math.round(data.buyIn);
        if (buyIn < table.minBuyIn || buyIn > table.maxBuyIn) {
          const unit = isTonTable ? 'TON' : 'фишек';
          socket.emit('error', {
            message: `Размер бай-ина должен быть от ${table.minBuyIn} до ${table.maxBuyIn} ${unit}`
          });
          return;
        }

        // Atomic deduction based on currency
        const success = isTonTable
          ? db.deductTon(userInfo.userId, buyIn)
          : db.deductChips(userInfo.userId, buyIn);

        if (!success) {
          const currencyName = isTonTable ? 'TON' : 'фишек';
          socket.emit('error', { message: `Недостаточно ${currencyName} на балансе` });
          return;
        }

        const joined = table.joinTable({
          id: userInfo.userId,
          name: userInfo.name,
          username: userInfo.username,
          chips: buyIn,
          equipped: {
            cardBack: user.equipped?.cardBack,
            avatarFrame: user.equipped?.avatarFrame
          }
        }, data.seatIndex);

        if (!joined) {
          // Refund if join failed
          if (isTonTable) {
            db.updateTonBalance(userInfo.userId, buyIn);
          } else {
            db.updateChips(userInfo.userId, buyIn);
          }
          socket.emit('error', { message: 'Не удалось занять место за столом' });
          return;
        }

        socket.join(`table_${table.id}`);
        socket.emit('joined_table', { tableId: table.id, seatIndex: data.seatIndex, buyIn });
        socket.emit('user_updated', db.getUser(userInfo.userId));
        this.broadcastTableState(table);
      });

      // Leave a table
      socket.on('leave_table', (data: { tableId: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;

        const table = this.tables.get(data.tableId);
        if (!table) return;

        const player = table.leaveTable(userInfo.userId);
        if (player) {
          // Refund remaining chips or TON
          if (table.currency === 'TON') {
            db.updateTonBalance(userInfo.userId, player.chips);
          } else {
            db.updateChips(userInfo.userId, player.chips);
          }
        }

        socket.leave(`table_${table.id}`);
        socket.emit('left_table', { tableId: data.tableId });
        socket.emit('user_updated', db.getUser(userInfo.userId));
        this.broadcastTableState(table);
      });

      // Player action at table
      socket.on('table_action', (data: {
        tableId: string;
        action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';
        amount?: number;
      }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;

        const table = this.tables.get(data.tableId);
        if (!table) return;

        // Verify turn
        if (table.currentTurnSeat === null || table.seats[table.currentTurnSeat]?.id !== userInfo.userId) {
          socket.emit('action_failed', { message: 'Сейчас не ваш ход' });
          return;
        }

        const success = table.handleAction(userInfo.userId, data.action, data.amount);
        if (!success) {
          socket.emit('action_failed', { message: 'Недопустимое действие' });
        }
      });

      // Claim daily bonus
      socket.on('claim_daily_bonus', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;

        const result = db.claimDailyBonus(userInfo.userId);
        socket.emit('daily_bonus_result', result);
        if (result.success) {
          socket.emit('user_updated', db.getUser(userInfo.userId));
        }
      });

      // Get leaderboard
      socket.on('get_leaderboard', () => {
        socket.emit('leaderboard_data', db.getLeaderboard());
      });

      // Quests
      socket.on('get_quests', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        socket.emit('quests_data', db.getQuests(userInfo.userId));
      });

      socket.on('claim_quest', (data: { questId: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        const res = db.claimQuest(userInfo.userId, data.questId);
        socket.emit('quest_claim_result', res);
        socket.emit('quests_data', db.getQuests(userInfo.userId));
        socket.emit('user_updated', db.getUser(userInfo.userId));
      });

      // Achievements
      socket.on('get_achievements', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        socket.emit('achievements_data', db.getAchievements(userInfo.userId));
      });

      // Season Pass
      socket.on('get_season_pass', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        socket.emit('season_pass_data', db.getSeasonPass(userInfo.userId));
      });

      socket.on('claim_season_tier', (data: { tier: number }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        const res = db.claimSeasonReward(userInfo.userId, data.tier);
        socket.emit('season_reward_result', res);
        socket.emit('season_pass_data', db.getSeasonPass(userInfo.userId));
        socket.emit('user_updated', db.getUser(userInfo.userId));
      });

      // Cosmetics & Wardrobe
      socket.on('get_cosmetics', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        socket.emit('cosmetics_data', db.getCosmetics(userInfo.userId));
      });

      socket.on('buy_cosmetic', (data: { itemId: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        const res = db.buyCosmetic(userInfo.userId, data.itemId);
        socket.emit('buy_cosmetic_result', res);
        socket.emit('cosmetics_data', db.getCosmetics(userInfo.userId));
        socket.emit('user_updated', db.getUser(userInfo.userId));
      });

      socket.on('equip_cosmetic', (data: { category: 'cardBack' | 'avatarFrame' | 'tableTheme' | 'chipStyle'; itemId: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;

        const success = db.equipCosmetic(userInfo.userId, data.category, data.itemId);
        if (success) {
          // Update active seated player
          for (const table of this.tables.values()) {
            const player = table.seats.find(p => p?.id === userInfo.userId);
            if (player) {
              if (!player.equipped) player.equipped = {};
              if (data.category === 'cardBack') player.equipped.cardBack = data.itemId;
              if (data.category === 'avatarFrame') player.equipped.avatarFrame = data.itemId;
              this.broadcastTableState(table);
            }
          }
          socket.emit('cosmetics_data', db.getCosmetics(userInfo.userId));
          socket.emit('user_updated', db.getUser(userInfo.userId));
        }
      });

      // Hand History
      socket.on('get_hand_history', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        const user = db.getUser(userInfo.userId);
        socket.emit('hand_history_data', user?.handHistory || []);
      });

      // Table Reactions
      socket.on('send_table_reaction', (data: { tableId: string; emoji: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;

        const now = Date.now();
        const lastReaction = this.reactionCooldowns.get(userInfo.userId) || 0;
        if (now - lastReaction < 3000) {
          socket.emit('error', { message: 'Подождите немного перед отправкой следующей реакции' });
          return;
        }

        const table = this.tables.get(data.tableId);
        if (!table) return;

        const player = table.seats.find(p => p?.id === userInfo.userId);
        if (!player) return;

        this.reactionCooldowns.set(userInfo.userId, now);

        this.io.to(`table_${data.tableId}`).emit('player_reaction', {
          tableId: data.tableId,
          seatIndex: player.seatIndex,
          playerId: userInfo.userId,
          playerName: userInfo.name,
          emoji: data.emoji
        });
      });

      // Tournaments
      socket.on('get_tournaments', () => {
        socket.emit('tournaments_list', this.tournamentManager.getTournaments());
      });

      socket.on('join_tournament', (data: { tournamentId: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;

        const result = this.tournamentManager.registerPlayer(data.tournamentId, {
          id: userInfo.userId,
          name: userInfo.name,
          username: userInfo.username
        });

        socket.emit('tournament_action_result', result);
        this.io.emit('tournaments_list', this.tournamentManager.getTournaments());
        socket.emit('user_updated', db.getUser(userInfo.userId));

        // If tournament started and has a table, register listeners
        const tourTable = this.tournamentManager.getTable(data.tournamentId);
        if (tourTable && !this.tables.has(tourTable.id)) {
          this.tables.set(tourTable.id, tourTable);
          tourTable.setOnStateChange(() => this.broadcastTableState(tourTable));
          tourTable.setOnHandFinished((hr, pl) => this.handleHandFinished(tourTable, hr, pl));
        }
      });

      socket.on('leave_tournament', (data: { tournamentId: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;

        const result = this.tournamentManager.unregisterPlayer(data.tournamentId, userInfo.userId);
        socket.emit('tournament_action_result', result);
        this.io.emit('tournaments_list', this.tournamentManager.getTournaments());
        socket.emit('user_updated', db.getUser(userInfo.userId));
      });

      socket.on('fill_tournament_bots', (data: { tournamentId: string }) => {
        this.tournamentManager.fillWithBots(data.tournamentId);
        this.io.emit('tournaments_list', this.tournamentManager.getTournaments());

        const tourTable = this.tournamentManager.getTable(data.tournamentId);
        if (tourTable && !this.tables.has(tourTable.id)) {
          this.tables.set(tourTable.id, tourTable);
          tourTable.setOnStateChange(() => this.broadcastTableState(tourTable));
          tourTable.setOnHandFinished((hr, pl) => this.handleHandFinished(tourTable, hr, pl));
        }
      });

      // Lucky Wheel
      socket.on('spin_wheel', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;

        const result = db.spinLuckyWheel(userInfo.userId);
        socket.emit('spin_wheel_result', result);
        socket.emit('user_updated', db.getUser(userInfo.userId));
      });

      // TON Wallet & Crypto
      socket.on('set_ton_wallet', (data: { address: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo || !data?.address) return;

        db.setTonWallet(userInfo.userId, data.address);
        socket.emit('user_updated', db.getUser(userInfo.userId));
      });

      socket.on('deposit_ton', async (data: { amount: number; boc?: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo || !data?.amount || data.amount <= 0) return;

        const newBal = db.updateTonBalance(userInfo.userId, data.amount);
        socket.emit('ton_deposit_success', {
          amount: data.amount,
          newBalance: newBal,
          message: `Депозит +${data.amount} TON успешно зачислен!`
        });
        socket.emit('user_updated', db.getUser(userInfo.userId));

        try {
          await this.bot.notifyAdminDeposit(userInfo.userId, data.amount, data.boc);
        } catch (e) {
          console.error('[Socket] Failed to notify admin about deposit:', e);
        }
      });

      socket.on('withdraw_ton', async (data: { amount: number; address: string }) => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo || !data?.amount || data.amount <= 0 || !data.address) {
          socket.emit('error', { message: 'Некорректные параметры вывода' });
          return;
        }

        const req = db.createWithdrawalRequest(userInfo.userId, data.amount, data.address.trim());
        if (!req) {
          socket.emit('error', { message: 'Недостаточно TON на балансе для вывода' });
          return;
        }

        socket.emit('ton_withdraw_success', {
          amount: data.amount,
          address: data.address,
          requestId: req.id,
          message: `Заявка #${req.id} на вывод ${data.amount} TON принята! Средства будут переведены администратором.`
        });
        socket.emit('user_updated', db.getUser(userInfo.userId));
        socket.emit('withdrawals_list', db.getUserWithdrawals(userInfo.userId));

        try {
          await this.bot.notifyAdminWithdrawal(req);
        } catch (e) {
          console.error('[Socket] Failed to notify admin about withdrawal:', e);
        }
      });

      socket.on('get_withdrawals', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (!userInfo) return;
        socket.emit('withdrawals_list', db.getUserWithdrawals(userInfo.userId));
      });

      // Disconnect with Grace Period
      socket.on('disconnect', () => {
        const userInfo = this.socketUserMap.get(socket.id);
        if (userInfo) {
          const userId = userInfo.userId;
          for (const table of this.tables.values()) {
            const seatedPlayer = table.seats.find(p => p?.id === userId);
            if (seatedPlayer) {
              // Mark player as disconnected
              table.setPlayerDisconnected(userId, true);
              this.broadcastTableState(table);

              // 60-second grace timer before actual eviction
              const timer = setTimeout(() => {
                const player = table.leaveTable(userId);
                if (player) {
                  if (table.currency === 'TON') {
                    db.updateTonBalance(userId, player.chips);
                  } else {
                    db.updateChips(userId, player.chips);
                  }
                }
                this.broadcastTableState(table);
                this.disconnectTimers.delete(userId);
              }, 60000);

              this.disconnectTimers.set(userId, timer);
            }
          }
          this.socketUserMap.delete(socket.id);
        }
      });
    });
  }

  public getTableList(): any[] {
    return Array.from(this.tables.values()).map(t => ({
      id: t.id,
      name: t.name,
      smallBlind: t.smallBlind,
      bigBlind: t.bigBlind,
      minBuyIn: t.minBuyIn,
      maxBuyIn: t.maxBuyIn,
      maxSeats: t.maxSeats,
      playersCount: t.seats.filter(s => s !== null).length,
      status: t.status,
      minStarsRequired: t.minStarsRequired,
      isVip: t.isVip,
      currency: t.currency
    }));
  }
}
