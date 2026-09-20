export type Suit = 'h' | 'd' | 'c' | 's'; // hearts, diamonds, clubs, spades
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
  code: string; // e.g. "Ah", "Kd", "Ts"
}

export type PlayerStatus = 'ACTIVE' | 'FOLDED' | 'ALL_IN' | 'SITTING_OUT';

export interface Player {
  id: string; // telegram user id as string
  name: string;
  username?: string;
  avatarUrl?: string;
  chips: number; // chips on table
  currentBet: number;
  cards: Card[]; // hole cards
  status: PlayerStatus;
  seatIndex: number;
  isBot?: boolean;
  isDisconnected?: boolean;
  timeRemaining?: number;
  equipped?: {
    cardBack?: string;
    avatarFrame?: string;
  };
}

export type BettingStage = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
export type TableStatus = 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'ENDED';

export interface ActionLogEntry {
  stage: BettingStage;
  seatIndex: number;
  playerId: string;
  playerName: string;
  action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';
  amount?: number;
  pot: number;
}

export interface HandRecord {
  id: string;
  timestamp: number;
  tableId: string;
  tableName: string;
  smallBlind: number;
  bigBlind: number;
  communityCards: Card[];
  myHoleCards: Card[];
  result: 'WIN' | 'LOSS' | 'FOLD';
  netChips: number;
  pot: number;
  actionLog: ActionLogEntry[];
  winners: HandResultWinner[];
  seats: { id: string; name: string; seatIndex: number; chips: number; cards: Card[] }[];
}

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface HandResultWinner {
  playerId: string;
  playerName: string;
  amount: number;
  handName: string;
  handRank: number;
  bestCards: Card[];
}

export interface HandResult {
  winners: HandResultWinner[];
  communityCards: Card[];
}

export interface TableState {
  id: string;
  name: string;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  status: TableStatus;
  stage: BettingStage;
  communityCards: Card[];
  pots: Pot[];
  totalPot: number;
  currentBet: number;
  minRaise: number;
  dealerSeat: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  currentTurnSeat: number | null;
  turnTimeLimit: number;
  turnStartTime: number | null;
  seats: (Player | null)[];
  lastAction?: {
    playerId: string;
    playerName: string;
    action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';
    amount?: number;
  };
  handResult?: HandResult | null;
  theme?: string;
  minStarsRequired?: number;
  isVip?: boolean;
  currency?: 'CHIPS' | 'TON';
}

export interface StarsPackage {
  id: string;
  stars: number;
  chips: number;
  title: string;
  badge?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'special';
  type: 'hands_played' | 'hands_won' | 'calls_made' | 'all_in_made' | 'earn_xp';
  target: number;
  rewardChips: number;
  rewardXp: number;
  expiresAt: number;
}

export interface UserQuestProgress {
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'gameplay' | 'progression' | 'streak' | 'tournament' | 'social';
  icon: string;
  target: number;
  rewardChips: number;
  rewardXp: number;
}

export interface UserAchievement {
  unlockedAt: number;
  progress: number;
}

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'cardBack' | 'avatarFrame' | 'tableTheme' | 'chipStyle';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  priceChips: number;
  icon: string;
  preview: string;
}

export interface SeasonPassTier {
  tier: number;
  requiredXp: number;
  freeReward: { chips?: number; cosmeticId?: string; title: string };
  vipReward: { chips?: number; cosmeticId?: string; title: string };
}

export interface TournamentPlayer {
  id: string;
  name: string;
  chips: number;
  seatIndex: number;
  isBot?: boolean;
  rank?: number;
  eliminated: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  buyIn: number;
  prizePool: number;
  maxPlayers: number;
  status: 'REGISTRATION' | 'RUNNING' | 'FINISHED';
  players: TournamentPlayer[];
  currentBlindIndex: number;
  nextBlindTime: number;
  winnerId?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username?: string;
  firstName?: string;
  amount: number;
  address: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  processedAt?: number;
}
