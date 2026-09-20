import fs from 'fs';
import path from 'path';
import {
  HandRecord,
  Quest,
  UserQuestProgress,
  Achievement,
  UserAchievement,
  CosmeticItem,
  SeasonPassTier
} from '../types/poker.js';

export interface UserRecord {
  id: string;
  username: string;
  firstName: string;
  chips: number;
  handsPlayed: number;
  handsWon: number;
  lastDailyBonus: number;
  referredBy?: string;
  referralCount: number;
  referralEarnings: number;
  invitedFriends: {
    id: string;
    name: string;
    date: number;
    bonus: number;
  }[];
  purchases: {
    date: number;
    stars: number;
    chips: number;
    chargeId?: string;
  }[];

  // XP & Levels
  xp: number;
  level: number;

  // Streaks & Stats
  currentStreak: number;
  bestStreak: number;
  biggestWin: number;
  biggestPotWon: number;

  // Quests & Achievements
  quests: Record<string, UserQuestProgress>;
  achievements: Record<string, UserAchievement>;

  // Season Pass
  seasonXp: number;
  seasonLevel: number;
  claimedSeasonTiers: number[];

  // Inventory & Cosmetics
  inventory: string[];
  equipped: {
    cardBack?: string;
    avatarFrame?: string;
    tableTheme?: string;
    chipStyle?: string;
  };

  // Hand History (last 30 hands)
  handHistory: HandRecord[];

  // Crypto / TON
  tonBalance: number;
  tonWalletAddress?: string;
  lastSpinTime: number;
}

export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  {
    id: 'first_win',
    title: 'Первая Победа',
    description: 'Выиграйте свою первую раздачу в покере',
    category: 'gameplay',
    icon: '🏆',
    target: 1,
    rewardChips: 500,
    rewardXp: 100
  },
  {
    id: 'hands_10',
    title: 'Начало Пути',
    description: 'Сыграйте 10 раздач за любыми столами',
    category: 'progression',
    icon: '🃏',
    target: 10,
    rewardChips: 1000,
    rewardXp: 150
  },
  {
    id: 'hands_100',
    title: 'Ветеран Покера',
    description: 'Сыграйте 100 раздач',
    category: 'progression',
    icon: '🎖',
    target: 100,
    rewardChips: 5000,
    rewardXp: 500
  },
  {
    id: 'wins_10',
    title: 'Опытный Игрок',
    description: 'Одержите 10 побед в раздачах',
    category: 'gameplay',
    icon: '⚡️',
    target: 10,
    rewardChips: 2500,
    rewardXp: 300
  },
  {
    id: 'wins_50',
    title: 'Гроза Столов',
    description: 'Одержите 50 побед в раздачах',
    category: 'gameplay',
    icon: '👑',
    target: 50,
    rewardChips: 10000,
    rewardXp: 1000
  },
  {
    id: 'streak_3',
    title: 'Горячая Рука',
    description: 'Выиграйте 3 раздачи подряд',
    category: 'streak',
    icon: '🔥',
    target: 3,
    rewardChips: 1500,
    rewardXp: 200
  },
  {
    id: 'streak_5',
    title: 'Неостановимый',
    description: 'Выиграйте 5 раздач подряд',
    category: 'streak',
    icon: '💥',
    target: 5,
    rewardChips: 5000,
    rewardXp: 500
  },
  {
    id: 'big_pot_10k',
    title: 'Крупный Куш',
    description: 'Выиграйте банк размером от $10,000 фишек',
    category: 'gameplay',
    icon: '💰',
    target: 1,
    rewardChips: 3000,
    rewardXp: 350
  },
  {
    id: 'all_in_win',
    title: 'Ва-банк и Победа',
    description: 'Выиграйте раздачу, пойдя Ва-банк',
    category: 'gameplay',
    icon: '🎯',
    target: 1,
    rewardChips: 2000,
    rewardXp: 250
  },
  {
    id: 'level_5',
    title: 'Восходящая Звезда',
    description: 'Достигните 5-го уровня игрока',
    category: 'progression',
    icon: '⭐️',
    target: 5,
    rewardChips: 2500,
    rewardXp: 300
  },
  {
    id: 'level_10',
    title: 'Мастер Клуба',
    description: 'Достигните 10-го уровня игрока',
    category: 'progression',
    icon: '💎',
    target: 10,
    rewardChips: 10000,
    rewardXp: 1000
  },
  {
    id: 'tournament_play',
    title: 'Турнирный Боец',
    description: 'Примите участие в покерном турнире',
    category: 'tournament',
    icon: '🏟',
    target: 1,
    rewardChips: 2000,
    rewardXp: 250
  },
  {
    id: 'invite_friend',
    title: 'Душа Компании',
    description: 'Пригласите друга в клуб по реферальной ссылке',
    category: 'social',
    icon: '👥',
    target: 1,
    rewardChips: 2500,
    rewardXp: 200
  }
];

export const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'daily_hands_10',
    title: 'Сыграть 10 раздач',
    description: 'Примите участие в 10 любых раздачах',
    category: 'daily',
    type: 'hands_played',
    target: 10,
    rewardChips: 1000,
    rewardXp: 100,
    expiresAt: 0
  },
  {
    id: 'daily_wins_3',
    title: 'Выиграть 3 раздачи',
    description: 'Одержите 3 победы за любым столом',
    category: 'daily',
    type: 'hands_won',
    target: 3,
    rewardChips: 1500,
    rewardXp: 150,
    expiresAt: 0
  },
  {
    id: 'daily_calls_5',
    title: 'Сделать 5 коллов',
    description: 'Уравняйте ставку 5 раз за день',
    category: 'daily',
    type: 'calls_made',
    target: 5,
    rewardChips: 800,
    rewardXp: 80,
    expiresAt: 0
  },
  {
    id: 'daily_all_in',
    title: 'Смелый Ва-банк',
    description: 'Пойдите Ва-банк хотя бы 1 раз',
    category: 'daily',
    type: 'all_in_made',
    target: 1,
    rewardChips: 1200,
    rewardXp: 120,
    expiresAt: 0
  },
  {
    id: 'weekly_hands_50',
    title: 'Недельный Марафон',
    description: 'Сыграйте 50 раздач за неделю',
    category: 'weekly',
    type: 'hands_played',
    target: 50,
    rewardChips: 5000,
    rewardXp: 500,
    expiresAt: 0
  },
  {
    id: 'weekly_wins_15',
    title: 'Серия Триумфов',
    description: 'Выиграйте 15 раздач за неделю',
    category: 'weekly',
    type: 'hands_won',
    target: 15,
    rewardChips: 8000,
    rewardXp: 800,
    expiresAt: 0
  }
];

export const COSMETICS_CATALOG: CosmeticItem[] = [
  // Card Backs
  {
    id: 'card_sapphire',
    name: 'Королевский Сапфир',
    category: 'cardBack',
    rarity: 'common',
    priceChips: 0,
    icon: '🔷',
    preview: 'bg-blue-900 border-amber-400'
  },
  {
    id: 'card_crimson',
    name: 'Багровый Дракон',
    category: 'cardBack',
    rarity: 'rare',
    priceChips: 5000,
    icon: '🐉',
    preview: 'bg-rose-950 border-rose-500'
  },
  {
    id: 'card_emerald',
    name: 'Изумрудное Золото',
    category: 'cardBack',
    rarity: 'epic',
    priceChips: 15000,
    icon: '🍀',
    preview: 'bg-emerald-950 border-amber-300'
  },
  {
    id: 'card_obsidian',
    name: 'Обсидиановая Тень',
    category: 'cardBack',
    rarity: 'legendary',
    priceChips: 35000,
    icon: '🖤',
    preview: 'bg-black border-purple-500'
  },

  // Avatar Frames
  {
    id: 'frame_bronze',
    name: 'Бронзовый Обод',
    category: 'avatarFrame',
    rarity: 'common',
    priceChips: 0,
    icon: '🥉',
    preview: 'border-amber-700'
  },
  {
    id: 'frame_silver',
    name: 'Серебряный Блеск',
    category: 'avatarFrame',
    rarity: 'rare',
    priceChips: 8000,
    icon: '🥈',
    preview: 'border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.6)]'
  },
  {
    id: 'frame_gold',
    name: 'Золотая Корона',
    category: 'avatarFrame',
    rarity: 'epic',
    priceChips: 20000,
    icon: '🥇',
    preview: 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.8)]'
  },
  {
    id: 'frame_neon',
    name: 'Неоновый Кибер',
    category: 'avatarFrame',
    rarity: 'legendary',
    priceChips: 45000,
    icon: '🔮',
    preview: 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.9)]'
  },

  // Table Themes
  {
    id: 'table_emerald',
    name: 'Классический Изумруд',
    category: 'tableTheme',
    rarity: 'common',
    priceChips: 0,
    icon: '🟩',
    preview: 'from-[#0e5c36] to-[#041f12]'
  },
  {
    id: 'table_midnight',
    name: 'Полуночный Синий',
    category: 'tableTheme',
    rarity: 'rare',
    priceChips: 12000,
    icon: '🟦',
    preview: 'from-[#0a2540] to-[#030e1a]'
  },
  {
    id: 'table_purple',
    name: 'Королевский Пурпур',
    category: 'tableTheme',
    rarity: 'epic',
    priceChips: 25000,
    icon: '🟪',
    preview: 'from-[#2e0854] to-[#120224]'
  }
];

export const SEASON_TIERS: SeasonPassTier[] = [
  { tier: 1, requiredXp: 100, freeReward: { chips: 1000, title: '1,000 Фишек' }, vipReward: { chips: 3000, title: '3,000 Фишек' } },
  { tier: 2, requiredXp: 250, freeReward: { chips: 1500, title: '1,500 Фишек' }, vipReward: { cosmeticId: 'card_crimson', title: 'Рубашка Багровый Дракон' } },
  { tier: 3, requiredXp: 500, freeReward: { chips: 2000, title: '2,000 Фишек' }, vipReward: { chips: 5000, title: '5,000 Фишек' } },
  { tier: 4, requiredXp: 800, freeReward: { cosmeticId: 'frame_silver', title: 'Рамка Серебряный Блеск' }, vipReward: { chips: 10000, title: '10,000 Фишек' } },
  { tier: 5, requiredXp: 1200, freeReward: { chips: 3000, title: '3,000 Фишек' }, vipReward: { cosmeticId: 'table_midnight', title: 'Сукно Полуночный Синий' } },
  { tier: 6, requiredXp: 1800, freeReward: { chips: 4000, title: '4,000 Фишек' }, vipReward: { chips: 15000, title: '15,000 Фишек' } },
  { tier: 7, requiredXp: 2500, freeReward: { chips: 5000, title: '5,000 Фишек' }, vipReward: { cosmeticId: 'card_emerald', title: 'Рубашка Изумрудное Золото' } },
  { tier: 8, requiredXp: 3500, freeReward: { chips: 7500, title: '7,500 Фишек' }, vipReward: { cosmeticId: 'frame_gold', title: 'Рамка Золотая Корона' } },
  { tier: 9, requiredXp: 5000, freeReward: { chips: 10000, title: '10,000 Фишек' }, vipReward: { cosmeticId: 'table_purple', title: 'Сукно Королевский Пурпур' } },
  { tier: 10, requiredXp: 7500, freeReward: { cosmeticId: 'card_obsidian', title: 'Рубашка Обсидиановая Тень' }, vipReward: { cosmeticId: 'frame_neon', title: 'Рамка Неоновый Кибер' } }
];

export class Database {
  private filePath: string;
  private users: Map<string, UserRecord> = new Map();

  constructor(dataDir: string = './data') {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'users.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw) as UserRecord[];
        for (const user of data) {
          this.users.set(user.id, user);
        }
      }
    } catch (err) {
      console.error('Failed to load database:', err);
    }
  }

  private save(): void {
    try {
      const data = Array.from(this.users.values());
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }

  public getOrCreateUser(id: string, firstName: string, username: string = ''): UserRecord {
    let user = this.users.get(id);
    if (!user) {
      user = {
        id,
        username: username || '',
        firstName: firstName || 'Player',
        chips: 2500, // 2,500 initial bonus chips
        handsPlayed: 0,
        handsWon: 0,
        lastDailyBonus: 0,
        referralCount: 0,
        referralEarnings: 0,
        invitedFriends: [],
        purchases: [],
        xp: 0,
        level: 1,
        currentStreak: 0,
        bestStreak: 0,
        biggestWin: 0,
        biggestPotWon: 0,
        quests: {},
        achievements: {},
        seasonXp: 0,
        seasonLevel: 1,
        claimedSeasonTiers: [],
        inventory: ['card_sapphire', 'frame_bronze', 'table_emerald'],
        equipped: {
          cardBack: 'card_sapphire',
          avatarFrame: 'frame_bronze',
          tableTheme: 'table_emerald'
        },
        handHistory: [],
        tonBalance: 0,
        lastSpinTime: 0
      };
      this.users.set(id, user);
      this.save();
    } else {
      // Ensure all fields exist for migrated accounts
      if (user.tonBalance === undefined) user.tonBalance = 0;
      if (user.lastSpinTime === undefined) user.lastSpinTime = 0;
      if (user.referralCount === undefined) user.referralCount = 0;
      if (user.referralEarnings === undefined) user.referralEarnings = 0;
      if (!user.invitedFriends) user.invitedFriends = [];
      if (user.xp === undefined) user.xp = 0;
      if (user.level === undefined) user.level = 1;
      if (user.currentStreak === undefined) user.currentStreak = 0;
      if (user.bestStreak === undefined) user.bestStreak = 0;
      if (user.biggestWin === undefined) user.biggestWin = 0;
      if (user.biggestPotWon === undefined) user.biggestPotWon = 0;
      if (!user.quests) user.quests = {};
      if (!user.achievements) user.achievements = {};
      if (user.seasonXp === undefined) user.seasonXp = 0;
      if (user.seasonLevel === undefined) user.seasonLevel = 1;
      if (!user.claimedSeasonTiers) user.claimedSeasonTiers = [];
      if (!user.inventory) user.inventory = ['card_sapphire', 'frame_bronze', 'table_emerald'];
      if (!user.equipped) {
        user.equipped = {
          cardBack: 'card_sapphire',
          avatarFrame: 'frame_bronze',
          tableTheme: 'table_emerald'
        };
      }
      if (!user.handHistory) user.handHistory = [];

      // Update names if changed
      if (firstName && user.firstName !== firstName) user.firstName = firstName;
      if (username && user.username !== username) user.username = username;
    }
    return user;
  }

  public processReferral(newUserId: string, referrerId: string): {
    success: boolean;
    bonusUser: number;
    bonusReferrer: number;
    referrerName?: string;
    message: string;
  } {
    if (!referrerId || newUserId === referrerId) {
      return { success: false, bonusUser: 0, bonusReferrer: 0, message: 'Нельзя пригласить самого себя' };
    }

    const newUser = this.users.get(newUserId);
    const referrer = this.users.get(referrerId);

    if (!newUser) {
      return { success: false, bonusUser: 0, bonusReferrer: 0, message: 'Новый пользователь не найден' };
    }

    if (!referrer) {
      return { success: false, bonusUser: 0, bonusReferrer: 0, message: 'Пригласивший пользователь не найден' };
    }

    if (newUser.referredBy) {
      return { success: false, bonusUser: 0, bonusReferrer: 0, message: 'Пользователь уже был приглашен' };
    }

    const BONUS_USER = 1000;
    const BONUS_REFERRER = 2500;

    newUser.referredBy = referrerId;
    newUser.chips += BONUS_USER;

    if (referrer.referralCount === undefined) referrer.referralCount = 0;
    if (referrer.referralEarnings === undefined) referrer.referralEarnings = 0;
    if (!referrer.invitedFriends) referrer.invitedFriends = [];

    referrer.chips += BONUS_REFERRER;
    referrer.referralCount += 1;
    referrer.referralEarnings += BONUS_REFERRER;
    referrer.invitedFriends.push({
      id: newUserId,
      name: newUser.firstName,
      date: Date.now(),
      bonus: BONUS_REFERRER
    });

    this.checkAchievements(referrerId, 'social', 1);
    this.save();

    return {
      success: true,
      bonusUser: BONUS_USER,
      bonusReferrer: BONUS_REFERRER,
      referrerName: referrer.firstName,
      message: `Успешно! Вы получили +${BONUS_USER.toLocaleString()} фишек, а ваш друг +${BONUS_REFERRER.toLocaleString()} фишек!`
    };
  }

  public getUser(id: string): (UserRecord & { totalStarsPurchased: number }) | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const totalStars = (user.purchases || []).reduce((sum, p) => sum + (p.stars || 0), 0);
    return {
      ...user,
      totalStarsPurchased: totalStars
    };
  }

  public getUserTotalStarsPurchased(id: string): number {
    const user = this.users.get(id);
    if (!user || !user.purchases) return 0;
    return user.purchases.reduce((sum, p) => sum + (p.stars || 0), 0);
  }

  public updateChips(id: string, delta: number): number {
    const user = this.users.get(id);
    if (!user) return 0;
    user.chips = Math.max(0, user.chips + delta);
    this.save();
    return user.chips;
  }

  public deductChips(id: string, amount: number): boolean {
    const user = this.users.get(id);
    if (!user || user.chips < amount || amount < 0) return false;
    user.chips -= amount;
    this.save();
    return true;
  }

  // XP & Level Progression
  public addXp(id: string, amount: number): { newXp: number; newLevel: number; leveledUp: boolean; rewardChips: number } {
    const user = this.users.get(id);
    if (!user) return { newXp: 0, newLevel: 1, leveledUp: false, rewardChips: 0 };

    user.xp = (user.xp || 0) + amount;
    user.seasonXp = (user.seasonXp || 0) + amount;

    // Level formula: level = floor(sqrt(xp / 150)) + 1
    const calculatedLevel = Math.floor(Math.sqrt(user.xp / 150)) + 1;
    let leveledUp = false;
    let rewardChips = 0;

    if (calculatedLevel > (user.level || 1)) {
      leveledUp = true;
      user.level = calculatedLevel;
      rewardChips = calculatedLevel * 1000;
      user.chips += rewardChips;
      this.checkAchievements(id, 'progression', user.level);
    }

    this.updateQuestProgress(id, 'earn_xp', amount);
    this.save();

    return {
      newXp: user.xp,
      newLevel: user.level,
      leveledUp,
      rewardChips
    };
  }

  // Winning Streak Management
  public updateStreak(id: string, won: boolean): { currentStreak: number; bestStreak: number } {
    const user = this.users.get(id);
    if (!user) return { currentStreak: 0, bestStreak: 0 };

    if (won) {
      user.currentStreak = (user.currentStreak || 0) + 1;
      user.bestStreak = Math.max(user.bestStreak || 0, user.currentStreak);
      this.checkAchievements(id, 'streak', user.currentStreak);
    } else {
      user.currentStreak = 0;
    }

    this.save();
    return {
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak
    };
  }

  // Track Full Hand Result, History & Statistics
  public trackHandResult(
    id: string,
    hand: HandRecord,
    won: boolean,
    netChips: number,
    pot: number
  ): void {
    const user = this.users.get(id);
    if (!user) return;

    user.handsPlayed = (user.handsPlayed || 0) + 1;
    if (won) {
      user.handsWon = (user.handsWon || 0) + 1;
      user.biggestWin = Math.max(user.biggestWin || 0, netChips);
      user.biggestPotWon = Math.max(user.biggestPotWon || 0, pot);
    }

    // Add to hand history (keep last 30 hands)
    if (!user.handHistory) user.handHistory = [];
    user.handHistory.unshift(hand);
    if (user.handHistory.length > 30) {
      user.handHistory.pop();
    }

    // Progress Quests
    this.updateQuestProgress(id, 'hands_played', 1);
    if (won) {
      this.updateQuestProgress(id, 'hands_won', 1);
    }

    // Check Achievements
    this.checkAchievements(id, 'gameplay', won ? 1 : 0);
    this.checkAchievements(id, 'progression', user.handsPlayed);
    if (pot >= 10000 && won) {
      this.checkAchievements(id, 'big_pot', 1);
    }

    this.save();
  }

  // Quests System
  public updateQuestProgress(id: string, type: Quest['type'], amount: number = 1): void {
    const user = this.users.get(id);
    if (!user) return;

    if (!user.quests) user.quests = {};

    for (const q of DEFAULT_QUESTS) {
      if (q.type === type) {
        const current = user.quests[q.id] || { progress: 0, completed: false, claimed: false };
        if (!current.completed) {
          current.progress = Math.min(q.target, current.progress + amount);
          if (current.progress >= q.target) {
            current.completed = true;
          }
          user.quests[q.id] = current;
        }
      }
    }
  }

  public claimQuest(id: string, questId: string): { success: boolean; rewardChips: number; rewardXp: number; message: string } {
    const user = this.users.get(id);
    if (!user) return { success: false, rewardChips: 0, rewardXp: 0, message: 'Пользователь не найден' };

    const quest = DEFAULT_QUESTS.find(q => q.id === questId);
    if (!quest) return { success: false, rewardChips: 0, rewardXp: 0, message: 'Задание не найдено' };

    const progress = user.quests?.[questId];
    if (!progress || !progress.completed) {
      return { success: false, rewardChips: 0, rewardXp: 0, message: 'Задание еще не выполнено' };
    }

    if (progress.claimed) {
      return { success: false, rewardChips: 0, rewardXp: 0, message: 'Награда уже получена' };
    }

    progress.claimed = true;
    user.chips += quest.rewardChips;
    this.addXp(id, quest.rewardXp);
    this.save();

    return {
      success: true,
      rewardChips: quest.rewardChips,
      rewardXp: quest.rewardXp,
      message: `Вы получили +$${quest.rewardChips.toLocaleString()} фишек и +${quest.rewardXp} XP!`
    };
  }

  public getQuests(id: string): { daily: any[]; weekly: any[] } {
    const user = this.users.get(id);
    const userQuests = user?.quests || {};

    const daily = DEFAULT_QUESTS.filter(q => q.category === 'daily').map(q => ({
      ...q,
      progress: userQuests[q.id]?.progress || 0,
      completed: userQuests[q.id]?.completed || false,
      claimed: userQuests[q.id]?.claimed || false
    }));

    const weekly = DEFAULT_QUESTS.filter(q => q.category === 'weekly').map(q => ({
      ...q,
      progress: userQuests[q.id]?.progress || 0,
      completed: userQuests[q.id]?.completed || false,
      claimed: userQuests[q.id]?.claimed || false
    }));

    return { daily, weekly };
  }

  // Achievements System
  public checkAchievements(id: string, category: string, value: number): string[] {
    const user = this.users.get(id);
    if (!user) return [];

    if (!user.achievements) user.achievements = {};
    const newlyUnlocked: string[] = [];

    for (const a of ACHIEVEMENTS_CATALOG) {
      if (user.achievements[a.id]?.unlockedAt) continue;

      let isCompleted = false;
      if (a.id === 'first_win' && user.handsWon >= 1) isCompleted = true;
      if (a.id === 'wins_10' && user.handsWon >= 10) isCompleted = true;
      if (a.id === 'wins_50' && user.handsWon >= 50) isCompleted = true;
      if (a.id === 'hands_10' && user.handsPlayed >= 10) isCompleted = true;
      if (a.id === 'hands_100' && user.handsPlayed >= 100) isCompleted = true;
      if (a.id === 'level_5' && user.level >= 5) isCompleted = true;
      if (a.id === 'level_10' && user.level >= 10) isCompleted = true;
      if (a.id === 'streak_3' && user.bestStreak >= 3) isCompleted = true;
      if (a.id === 'streak_5' && user.bestStreak >= 5) isCompleted = true;
      if (a.id === 'big_pot_10k' && user.biggestPotWon >= 10000) isCompleted = true;
      if (a.id === 'invite_friend' && user.referralCount >= 1) isCompleted = true;

      if (isCompleted) {
        user.achievements[a.id] = {
          unlockedAt: Date.now(),
          progress: a.target
        };
        user.chips += a.rewardChips;
        this.addXp(id, a.rewardXp);
        newlyUnlocked.push(a.title);
      }
    }

    if (newlyUnlocked.length > 0) {
      this.save();
    }
    return newlyUnlocked;
  }

  public getAchievements(id: string): { achievements: any[]; unlockedCount: number; totalCount: number } {
    const user = this.users.get(id);
    const userAch = user?.achievements || {};

    const achievements = ACHIEVEMENTS_CATALOG.map(a => {
      const u = userAch[a.id];
      return {
        ...a,
        unlocked: !!u?.unlockedAt,
        unlockedAt: u?.unlockedAt || null,
        progress: u?.progress || 0
      };
    });

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    return {
      achievements,
      unlockedCount,
      totalCount: achievements.length
    };
  }

  // Cosmetics & Wardrobe
  public buyCosmetic(id: string, itemId: string): { success: boolean; message: string } {
    const user = this.users.get(id);
    if (!user) return { success: false, message: 'Пользователь не найден' };

    const item = COSMETICS_CATALOG.find(c => c.id === itemId);
    if (!item) return { success: false, message: 'Предмет не найден' };

    if (!user.inventory) user.inventory = [];
    if (user.inventory.includes(itemId)) {
      return { success: false, message: 'Предмет уже куплен' };
    }

    if (user.chips < item.priceChips) {
      return { success: false, message: 'Недостаточно фишек для покупки' };
    }

    user.chips -= item.priceChips;
    user.inventory.push(itemId);
    this.save();

    return {
      success: true,
      message: `Вы успешно приобрели «${item.name}»!`
    };
  }

  public equipCosmetic(id: string, category: 'cardBack' | 'avatarFrame' | 'tableTheme' | 'chipStyle', itemId: string): boolean {
    const user = this.users.get(id);
    if (!user || !user.inventory?.includes(itemId)) return false;

    if (!user.equipped) user.equipped = {};
    user.equipped[category] = itemId;
    this.save();
    return true;
  }

  public getCosmetics(id: string): { items: any[]; inventory: string[]; equipped: any } {
    const user = this.users.get(id);
    const inventory = user?.inventory || ['card_sapphire', 'frame_bronze', 'table_emerald'];
    const equipped = user?.equipped || { cardBack: 'card_sapphire', avatarFrame: 'frame_bronze', tableTheme: 'table_emerald' };

    const items = COSMETICS_CATALOG.map(item => ({
      ...item,
      owned: inventory.includes(item.id),
      equipped: equipped[item.category] === item.id
    }));

    return { items, inventory, equipped };
  }

  // Season Pass
  public claimSeasonReward(id: string, tierNumber: number): { success: boolean; message: string; reward?: any } {
    const user = this.users.get(id);
    if (!user) return { success: false, message: 'Пользователь не найден' };

    const tier = SEASON_TIERS.find(t => t.tier === tierNumber);
    if (!tier) return { success: false, message: 'Уровень сезона не найден' };

    if ((user.seasonXp || 0) < tier.requiredXp) {
      return { success: false, message: 'Недостаточно сезонного опыта' };
    }

    if (!user.claimedSeasonTiers) user.claimedSeasonTiers = [];
    if (user.claimedSeasonTiers.includes(tierNumber)) {
      return { success: false, message: 'Награда этого уровня уже получена' };
    }

    user.claimedSeasonTiers.push(tierNumber);
    let rewardDesc = '';

    if (tier.freeReward.chips) {
      user.chips += tier.freeReward.chips;
      rewardDesc += `+$${tier.freeReward.chips.toLocaleString()} фишек`;
    }
    if (tier.freeReward.cosmeticId) {
      if (!user.inventory.includes(tier.freeReward.cosmeticId)) {
        user.inventory.push(tier.freeReward.cosmeticId);
      }
      rewardDesc += ` «${tier.freeReward.title}»`;
    }

    this.save();
    return {
      success: true,
      message: `Вы получили награду ${tierNumber}-го уровня: ${rewardDesc}!`,
      reward: tier.freeReward
    };
  }

  public getSeasonPass(id: string): any {
    const user = this.users.get(id);
    const seasonXp = user?.seasonXp || 0;
    const claimed = user?.claimedSeasonTiers || [];

    const tiers = SEASON_TIERS.map(t => ({
      ...t,
      unlocked: seasonXp >= t.requiredXp,
      claimed: claimed.includes(t.tier)
    }));

    return {
      seasonNumber: 1,
      seasonName: 'Королевский Дебют',
      seasonXp,
      tiers
    };
  }

  // Daily Bonus
  public claimDailyBonus(id: string): { success: boolean; chips: number; message: string } {
    const user = this.users.get(id);
    if (!user) return { success: false, chips: 0, message: 'Пользователь не найден' };

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - user.lastDailyBonus < oneDay) {
      const hoursLeft = Math.ceil((oneDay - (now - user.lastDailyBonus)) / (60 * 60 * 1000));
      return {
        success: false,
        chips: user.chips,
        message: `Бонус уже получен. Возвращайтесь через ${hoursLeft} ч.`
      };
    }

    const BONUS_AMOUNT = 1000;
    user.chips += BONUS_AMOUNT;
    user.lastDailyBonus = now;
    this.addXp(id, 100);
    this.save();

    return {
      success: true,
      chips: user.chips,
      message: `Вы получили ежедневный бонус +${BONUS_AMOUNT} фишек и +100 XP!`
    };
  }

  public recordPurchase(id: string, stars: number, chips: number, chargeId?: string): number {
    const user = this.users.get(id);
    if (!user) return 0;

    user.chips += chips;
    user.purchases.push({
      date: Date.now(),
      stars,
      chips,
      chargeId
    });
    this.addXp(id, stars * 10);
    this.save();
    return user.chips;
  }

  public updateTonBalance(id: string, delta: number): number {
    const user = this.users.get(id);
    if (!user) return 0;
    user.tonBalance = Math.max(0, parseFloat(((user.tonBalance || 0) + delta).toFixed(4)));
    this.save();
    return user.tonBalance;
  }

  public deductTon(id: string, amount: number): boolean {
    const user = this.users.get(id);
    if (!user || (user.tonBalance || 0) < amount || amount < 0) return false;
    user.tonBalance = parseFloat((user.tonBalance - amount).toFixed(4));
    this.save();
    return true;
  }

  public setTonWallet(id: string, address: string): void {
    const user = this.users.get(id);
    if (!user) return;
    user.tonWalletAddress = address;
    this.save();
  }

  public spinLuckyWheel(id: string): {
    success: boolean;
    prize?: { type: 'chips' | 'ton' | 'xp'; amount: number; label: string };
    nextSpinIn: number;
    message: string;
  } {
    const user = this.users.get(id);
    if (!user) return { success: false, nextSpinIn: 0, message: 'Пользователь не найден' };

    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const timeSinceLast = now - (user.lastSpinTime || 0);

    if (timeSinceLast < cooldown) {
      return {
        success: false,
        nextSpinIn: cooldown - timeSinceLast,
        message: 'Колесо уже прокручено сегодня. Возвращайтесь позже!'
      };
    }

    // Weighted prizes
    const prizes: { type: 'chips' | 'ton' | 'xp'; amount: number; label: string; weight: number }[] = [
      { type: 'chips', amount: 500, label: '500 Фишек', weight: 35 },
      { type: 'chips', amount: 1000, label: '1,000 Фишек', weight: 25 },
      { type: 'chips', amount: 2500, label: '2,500 Фишек', weight: 18 },
      { type: 'chips', amount: 5000, label: '5,000 Фишек', weight: 10 },
      { type: 'chips', amount: 10000, label: '10,000 Фишек', weight: 6 },
      { type: 'ton', amount: 0.05, label: '💎 0.05 TON', weight: 3.5 },
      { type: 'ton', amount: 0.1, label: '💎 0.1 TON', weight: 2 },
      { type: 'ton', amount: 0.5, label: '💎 0.5 TON (ДЖЕКПОТ!)', weight: 0.5 }
    ];

    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedPrize = prizes[0];

    for (const p of prizes) {
      if (rand < p.weight) {
        selectedPrize = p;
        break;
      }
      rand -= p.weight;
    }

    user.lastSpinTime = now;

    if (selectedPrize.type === 'chips') {
      user.chips += selectedPrize.amount;
    } else if (selectedPrize.type === 'ton') {
      user.tonBalance = parseFloat(((user.tonBalance || 0) + selectedPrize.amount).toFixed(4));
    } else if (selectedPrize.type === 'xp') {
      this.addXp(id, selectedPrize.amount);
    }

    this.save();

    return {
      success: true,
      prize: {
        type: selectedPrize.type,
        amount: selectedPrize.amount,
        label: selectedPrize.label
      },
      nextSpinIn: cooldown,
      message: `Поздравляем! Вы выиграли ${selectedPrize.label}!`
    };
  }

  public getLeaderboard(limit: number = 10): { id: string; name: string; chips: number; handsWon: number; level: number }[] {
    return Array.from(this.users.values())
      .sort((a, b) => b.chips - a.chips)
      .slice(0, limit)
      .map(u => ({
        id: u.id,
        name: u.username ? `@${u.username}` : u.firstName,
        chips: u.chips,
        handsWon: u.handsWon,
        level: u.level || 1
      }));
  }
}

export const db = new Database();
