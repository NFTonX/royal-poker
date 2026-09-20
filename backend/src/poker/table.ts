import { Card, BettingStage, HandResult, Player, Pot, TableState, TableStatus, ActionLogEntry, HandRecord, HandResultWinner } from '../types/poker.js';
import { Deck } from './deck.js';
import { PokerEvaluator } from './evaluator.js';

export interface TableConfig {
  id: string;
  name: string;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxSeats?: number;
  turnTimeLimit?: number; // in seconds
  minStarsRequired?: number;
  isVip?: boolean;
  currency?: 'CHIPS' | 'TON';
}

export class PokerTable {
  public id: string;
  public name: string;
  public smallBlind: number;
  public bigBlind: number;
  public minBuyIn: number;
  public maxBuyIn: number;
  public maxSeats: number;
  public turnTimeLimit: number;
  public minStarsRequired: number;
  public isVip: boolean;
  public currency: 'CHIPS' | 'TON';

  public status: TableStatus = 'WAITING';
  public stage: BettingStage = 'PREFLOP';
  public seats: (Player | null)[];
  public deck: Deck;
  public communityCards: Card[] = [];
  public pots: Pot[] = [];
  public currentBet: number = 0;
  public minRaise: number = 0;
  public dealerSeat: number = 0;
  public smallBlindSeat: number = 0;
  public bigBlindSeat: number = 0;
  public currentTurnSeat: number | null = null;
  public turnStartTime: number | null = null;
  public lastAction?: TableState['lastAction'];
  public handResult?: HandResult | null = null;
  public actionLog: ActionLogEntry[] = [];

  // Track who has acted in the current betting round
  private playersActedThisRound: Set<string> = new Set();
  private turnTimer: NodeJS.Timeout | null = null;
  private nextHandTimer: NodeJS.Timeout | null = null;
  private onStateChangeCallback?: () => void;
  private onHandFinishedCallback?: (handRecord: HandRecord, players: Player[]) => void;

  constructor(config: TableConfig) {
    this.id = config.id;
    this.name = config.name;
    this.smallBlind = config.smallBlind;
    this.bigBlind = config.bigBlind;
    this.minBuyIn = config.minBuyIn;
    this.maxBuyIn = config.maxBuyIn;
    this.maxSeats = config.maxSeats || 6;
    this.turnTimeLimit = config.turnTimeLimit || 15;
    this.minStarsRequired = config.minStarsRequired || 0;
    this.isVip = !!config.isVip;
    this.currency = config.currency || 'CHIPS';
    this.seats = new Array(this.maxSeats).fill(null);
    this.deck = new Deck();
  }

  public setOnStateChange(cb: () => void): void {
    this.onStateChangeCallback = cb;
  }

  public setOnHandFinished(cb: (handRecord: HandRecord, players: Player[]) => void): void {
    this.onHandFinishedCallback = cb;
  }

  private triggerHandFinished(winners: HandResultWinner[]): void {
    if (!this.onHandFinishedCallback) return;
    const totalPot = this.pots.reduce((sum, p) => sum + p.amount, 0) +
      this.seats.reduce((sum, p) => sum + (p ? p.currentBet : 0), 0);

    const activeSeats = this.seats.filter((p): p is Player => p !== null).map(p => ({
      id: p.id,
      name: p.name,
      seatIndex: p.seatIndex,
      chips: p.chips,
      cards: [...p.cards]
    }));

    const handRecord: HandRecord = {
      id: `hand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      tableId: this.id,
      tableName: this.name,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      communityCards: [...this.communityCards],
      myHoleCards: [],
      result: 'LOSS',
      netChips: 0,
      pot: totalPot,
      actionLog: [...this.actionLog],
      winners,
      seats: activeSeats
    };

    const playersSnapshot = this.seats.filter((p): p is Player => p !== null);
    this.onHandFinishedCallback(handRecord, playersSnapshot);
  }

  private notifyStateChange(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback();
    }
  }

  public getState(forPlayerId?: string): TableState {
    // Mask hole cards of other players unless it's showdown
    const sanitizedSeats = this.seats.map(p => {
      if (!p) return null;
      const showCards = this.stage === 'SHOWDOWN' || (forPlayerId && p.id === forPlayerId);
      return {
        ...p,
        cards: showCards ? p.cards : []
      };
    });

    const totalPot = this.pots.reduce((sum, p) => sum + p.amount, 0) +
      this.seats.reduce((sum, p) => sum + (p ? p.currentBet : 0), 0);

    return {
      id: this.id,
      name: this.name,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      minBuyIn: this.minBuyIn,
      maxBuyIn: this.maxBuyIn,
      status: this.status,
      stage: this.stage,
      communityCards: this.communityCards,
      pots: this.pots,
      totalPot,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      dealerSeat: this.dealerSeat,
      smallBlindSeat: this.smallBlindSeat,
      bigBlindSeat: this.bigBlindSeat,
      currentTurnSeat: this.currentTurnSeat,
      turnTimeLimit: this.turnTimeLimit,
      turnStartTime: this.turnStartTime,
      seats: sanitizedSeats,
      lastAction: this.lastAction,
      handResult: this.handResult,
      minStarsRequired: this.minStarsRequired,
      isVip: this.isVip,
      currency: this.currency
    };
  }

  public getActivePlayers(): Player[] {
    return this.seats.filter((p): p is Player => p !== null && p.status !== 'SITTING_OUT');
  }

  public getInHandPlayers(): Player[] {
    return this.seats.filter((p): p is Player => p !== null && (p.status === 'ACTIVE' || p.status === 'ALL_IN'));
  }

  public joinTable(player: Omit<Player, 'currentBet' | 'cards' | 'status' | 'seatIndex'>, seatIndex: number): boolean {
    if (seatIndex < 0 || seatIndex >= this.maxSeats) return false;
    if (this.seats[seatIndex] !== null) return false;
    if (this.seats.some(p => p?.id === player.id)) return false;
    if (player.chips < this.minBuyIn) return false;

    this.seats[seatIndex] = {
      ...player,
      chips: Math.min(player.chips, this.maxBuyIn),
      currentBet: 0,
      cards: [],
      status: this.status === 'IN_PROGRESS' ? 'SITTING_OUT' : 'ACTIVE',
      seatIndex
    };

    this.notifyStateChange();

    // Check if we should start a hand
    if (this.status === 'WAITING' && this.getActivePlayers().length >= 2) {
      this.scheduleNextHand(1500);
    }

    return true;
  }

  public leaveTable(playerId: string): Player | null {
    const seatIndex = this.seats.findIndex(p => p?.id === playerId);
    if (seatIndex === -1) return null;

    const player = this.seats[seatIndex]!;
    
    // If it was this player's turn, handle fold first
    if (this.status === 'IN_PROGRESS' && this.currentTurnSeat === seatIndex) {
      this.handleAction(playerId, 'FOLD');
    }

    this.seats[seatIndex] = null;
    this.notifyStateChange();

    // Check if remaining active players < 2
    if (this.status === 'IN_PROGRESS' && this.getInHandPlayers().length < 2) {
      this.checkEndHand();
    } else if (this.getActivePlayers().length < 2) {
      this.status = 'WAITING';
      this.clearTimers();
      this.notifyStateChange();
    }

    return player;
  }

  public setPlayerDisconnected(playerId: string, disconnected: boolean): void {
    const player = this.seats.find(p => p?.id === playerId);
    if (player) {
      player.isDisconnected = disconnected;
      this.notifyStateChange();
    }
  }

  private onPlayerBustedCallback?: (player: Player) => void;

  public setOnPlayerBusted(cb: (player: Player) => void): void {
    this.onPlayerBustedCallback = cb;
  }

  public scheduleNextHand(delayMs: number = 3500): void {
    this.clearTimers();
    this.status = 'STARTING';
    this.notifyStateChange();

    this.nextHandTimer = setTimeout(() => {
      this.collectCardsAndBustCheck();
    }, delayMs);
  }

  private collectCardsAndBustCheck(): void {
    // 1. Collect all cards from board and players
    this.communityCards = [];
    this.handResult = null;
    this.pots = [];
    for (const p of this.seats) {
      if (p) {
        p.cards = [];
        p.currentBet = 0;
      }
    }

    // 2. Identify and remove any player who has insufficient chips (< bigBlind)
    const bustedPlayers: Player[] = [];
    for (let i = 0; i < this.seats.length; i++) {
      const p = this.seats[i];
      if (p && p.chips < this.bigBlind) {
        bustedPlayers.push(p);
        this.seats[i] = null; // Free up the seat for other players!
      }
    }

    // Notify state change so all clients see cards collected and seats vacated
    this.notifyStateChange();

    // Trigger busted callbacks for vacated players
    for (const bp of bustedPlayers) {
      if (this.onPlayerBustedCallback) {
        this.onPlayerBustedCallback(bp);
      }
    }

    // 3. Check remaining players who have enough chips to play
    const activeEligible = this.getActivePlayers().filter(p => p.chips >= this.bigBlind);

    if (activeEligible.length >= 2) {
      // 1 second pause after cards are collected, then deal new hand
      this.nextHandTimer = setTimeout(() => {
        this.startHand();
      }, 1000);
    } else {
      // Less than 2 players with chips: table goes to WAITING state, no cards dealt!
      this.status = 'WAITING';
      this.notifyStateChange();
    }
  }

  public startHand(): void {
    this.clearTimers();
    const activePlayers = this.getActivePlayers().filter(p => p.chips >= this.bigBlind);

    if (activePlayers.length < 2) {
      this.status = 'WAITING';
      this.notifyStateChange();
      return;
    }

    // Reset table
    this.status = 'IN_PROGRESS';
    this.stage = 'PREFLOP';
    this.deck.reset();
    this.communityCards = [];
    this.pots = [];
    this.handResult = null;
    this.lastAction = undefined;
    this.playersActedThisRound.clear();

    // Advance dealer button
    this.dealerSeat = this.getNextActiveSeat(this.dealerSeat);

    // Blinds
    if (activePlayers.length === 2) {
      // Heads-up: Dealer is Small Blind
      this.smallBlindSeat = this.dealerSeat;
      this.bigBlindSeat = this.getNextActiveSeat(this.dealerSeat);
    } else {
      this.smallBlindSeat = this.getNextActiveSeat(this.dealerSeat);
      this.bigBlindSeat = this.getNextActiveSeat(this.smallBlindSeat);
    }

    // Reset players & deal cards
    for (const player of activePlayers) {
      player.cards = this.deck.draw(2);
      player.currentBet = 0;
      player.status = 'ACTIVE';
    }

    // Post Small Blind
    const sbPlayer = this.seats[this.smallBlindSeat]!;
    const sbAmount = Math.min(sbPlayer.chips, this.smallBlind);
    sbPlayer.chips -= sbAmount;
    sbPlayer.currentBet = sbAmount;
    if (sbPlayer.chips === 0) sbPlayer.status = 'ALL_IN';

    // Post Big Blind
    const bbPlayer = this.seats[this.bigBlindSeat]!;
    const bbAmount = Math.min(bbPlayer.chips, this.bigBlind);
    bbPlayer.chips -= bbAmount;
    bbPlayer.currentBet = bbAmount;
    if (bbPlayer.chips === 0) bbPlayer.status = 'ALL_IN';

    this.currentBet = this.bigBlind;
    this.minRaise = this.bigBlind;

    this.actionLog = [
      {
        stage: 'PREFLOP',
        seatIndex: this.smallBlindSeat,
        playerId: sbPlayer.id,
        playerName: sbPlayer.name,
        action: 'BET',
        amount: sbAmount,
        pot: sbAmount
      },
      {
        stage: 'PREFLOP',
        seatIndex: this.bigBlindSeat,
        playerId: bbPlayer.id,
        playerName: bbPlayer.name,
        action: 'BET',
        amount: bbAmount,
        pot: sbAmount + bbAmount
      }
    ];

    // First to act: after Big Blind (UTG)
    const firstToAct = this.getNextActionSeat(this.bigBlindSeat);
    this.setCurrentTurn(firstToAct);

    this.notifyStateChange();
    this.checkBotTurn();
  }

  public handleAction(
    playerId: string,
    action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN',
    amount?: number
  ): boolean {
    if (this.status !== 'IN_PROGRESS') return false;
    if (this.currentTurnSeat === null) return false;

    const player = this.seats[this.currentTurnSeat];
    if (!player || player.id !== playerId || player.status !== 'ACTIVE') return false;

    const callDiff = this.currentBet - player.currentBet;

    switch (action) {
      case 'FOLD': {
        player.status = 'FOLDED';
        this.lastAction = { playerId, playerName: player.name, action: 'FOLD' };
        break;
      }
      case 'CHECK': {
        if (callDiff > 0) return false; // Cannot check if there's a bet to call
        this.lastAction = { playerId, playerName: player.name, action: 'CHECK' };
        break;
      }
      case 'CALL': {
        const betAmount = Math.min(player.chips, callDiff);
        player.chips -= betAmount;
        player.currentBet += betAmount;
        if (player.chips === 0) player.status = 'ALL_IN';
        this.lastAction = { playerId, playerName: player.name, action: 'CALL', amount: betAmount };
        break;
      }
      case 'BET':
      case 'RAISE': {
        const targetBet = amount || (this.currentBet + this.minRaise);
        const addChips = targetBet - player.currentBet;
        if (addChips <= 0 || addChips > player.chips) return false;
        
        // Check minimum raise rule
        if (targetBet < this.currentBet + this.minRaise && addChips < player.chips) {
          return false;
        }

        const raiseSize = targetBet - this.currentBet;
        if (raiseSize > this.minRaise) {
          this.minRaise = raiseSize;
        }

        player.chips -= addChips;
        player.currentBet = targetBet;
        this.currentBet = targetBet;
        if (player.chips === 0) player.status = 'ALL_IN';

        this.lastAction = {
          playerId,
          playerName: player.name,
          action: action,
          amount: targetBet
        };
        // Reset players acted because bet increased
        this.playersActedThisRound.clear();
        break;
      }
      case 'ALL_IN': {
        const allInAmount = player.chips;
        const targetBet = player.currentBet + allInAmount;
        player.chips = 0;
        player.currentBet = targetBet;
        player.status = 'ALL_IN';

        if (targetBet > this.currentBet) {
          const raiseSize = targetBet - this.currentBet;
          if (raiseSize >= this.minRaise) {
            this.minRaise = raiseSize;
            this.playersActedThisRound.clear();
          }
          this.currentBet = targetBet;
        }

        this.lastAction = { playerId, playerName: player.name, action: 'ALL_IN', amount: targetBet };
        break;
      }
      default:
        return false;
    }

    this.playersActedThisRound.add(player.id);
    this.clearTurnTimer();

    const currentTotalPot = this.pots.reduce((sum, p) => sum + p.amount, 0) +
      this.seats.reduce((sum, p) => sum + (p ? p.currentBet : 0), 0);

    this.actionLog.push({
      stage: this.stage,
      seatIndex: player.seatIndex,
      playerId: player.id,
      playerName: player.name,
      action: action,
      amount: this.lastAction?.amount,
      pot: currentTotalPot
    });

    // Check if hand or round is complete
    if (this.checkEndHand()) {
      return true;
    }

    if (this.isBettingRoundComplete()) {
      this.advanceStage();
    } else {
      const nextSeat = this.getNextActionSeat(this.currentTurnSeat);
      this.setCurrentTurn(nextSeat);
    }

    this.notifyStateChange();
    this.checkBotTurn();
    return true;
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = this.seats.filter((p): p is Player => p !== null && p.status === 'ACTIVE');
    
    // If 0 or 1 active players (others folded or all-in), round is done
    if (activePlayers.length <= 1) {
      const activeUncalled = activePlayers.find(p => p.currentBet < this.currentBet);
      if (!activeUncalled) return true;
    }

    // All active players must have acted AND matched currentBet
    return activePlayers.every(p => this.playersActedThisRound.has(p.id) && p.currentBet === this.currentBet);
  }

  private collectBetsIntoPots(): void {
    // Calculate pots with side pots
    const playersWithBets = this.seats.filter((p): p is Player => p !== null && p.currentBet > 0);
    if (playersWithBets.length === 0) return;

    // Sort distinct bet levels
    const betLevels = Array.from(new Set(playersWithBets.map(p => p.currentBet))).sort((a, b) => a - b);

    let prevLevel = 0;
    for (const level of betLevels) {
      const diff = level - prevLevel;
      let potAddition = 0;
      const eligiblePlayers: string[] = [];

      for (const p of this.seats) {
        if (!p) continue;
        if (p.currentBet >= level) {
          potAddition += diff;
          if (p.status !== 'FOLDED') {
            eligiblePlayers.push(p.id);
          }
        } else if (p.currentBet > prevLevel) {
          potAddition += (p.currentBet - prevLevel);
          if (p.status !== 'FOLDED') {
            eligiblePlayers.push(p.id);
          }
        }
      }

      if (potAddition > 0) {
        // Add to existing pot if same eligible players or create new side pot
        const lastPot = this.pots[this.pots.length - 1];
        if (lastPot && this.arraysEqual(lastPot.eligiblePlayerIds, eligiblePlayers)) {
          lastPot.amount += potAddition;
        } else {
          this.pots.push({
            amount: potAddition,
            eligiblePlayerIds: eligiblePlayers
          });
        }
      }

      prevLevel = level;
    }

    // Reset player current bets for next round
    for (const p of this.seats) {
      if (p) p.currentBet = 0;
    }
    this.currentBet = 0;
    this.minRaise = this.bigBlind;
    this.playersActedThisRound.clear();
  }

  private advanceStage(): void {
    this.collectBetsIntoPots();

    const inHandPlayers = this.getInHandPlayers();
    const activeCount = inHandPlayers.filter(p => p.status === 'ACTIVE').length;

    // If 1 or 0 active players (meaning all remaining are all-in), fast-forward dealing to showdown
    if (activeCount <= 1 && inHandPlayers.length >= 2) {
      this.fastForwardToShowdown();
      return;
    }

    switch (this.stage) {
      case 'PREFLOP':
        this.stage = 'FLOP';
        this.communityCards = this.deck.draw(3);
        break;
      case 'FLOP':
        this.stage = 'TURN';
        this.communityCards.push(...this.deck.draw(1));
        break;
      case 'TURN':
        this.stage = 'RIVER';
        this.communityCards.push(...this.deck.draw(1));
        break;
      case 'RIVER':
        this.showdown();
        return;
    }

    // First to act after flop is first active player after dealer
    const nextTurn = this.getNextActionSeat(this.dealerSeat);
    this.setCurrentTurn(nextTurn);
    this.notifyStateChange();
    this.checkBotTurn();
  }

  private fastForwardToShowdown(): void {
    // Deal remaining community cards
    const needed = 5 - this.communityCards.length;
    if (needed > 0) {
      this.communityCards.push(...this.deck.draw(needed));
    }
    this.showdown();
  }

  private showdown(): void {
    this.clearTurnTimer();
    this.stage = 'SHOWDOWN';
    this.currentTurnSeat = null;

    const inHand = this.getInHandPlayers();
    const winners: HandResult['winners'] = [];

    // Award each pot to its winners
    for (const pot of this.pots) {
      const eligible = inHand.filter(p => pot.eligiblePlayerIds.includes(p.id));
      if (eligible.length === 0) continue;

      const potWinners = PokerEvaluator.determineWinners(eligible, this.communityCards, pot.amount);
      for (const pw of potWinners) {
        const existing = winners.find(w => w.playerId === pw.playerId);
        if (existing) {
          existing.amount += pw.amount;
        } else {
          winners.push(pw);
        }

        // Credit chips to player
        const player = this.seats.find(p => p?.id === pw.playerId);
        if (player) {
          player.chips += pw.amount;
        }
      }
    }

    this.handResult = {
      winners,
      communityCards: [...this.communityCards]
    };

    this.notifyStateChange();
    this.triggerHandFinished(winners);

    // Schedule next hand in 5 seconds
    this.scheduleNextHand(5000);
  }

  private checkEndHand(): boolean {
    const nonFolded = this.seats.filter((p): p is Player => p !== null && p.status !== 'FOLDED' && p.status !== 'SITTING_OUT');
    
    if (nonFolded.length === 1) {
      // Single winner by fold
      this.clearTurnTimer();
      this.collectBetsIntoPots();
      const winner = nonFolded[0];
      const totalPot = this.pots.reduce((sum, p) => sum + p.amount, 0);
      winner.chips += totalPot;

      this.handResult = {
        winners: [{
          playerId: winner.id,
          playerName: winner.name,
          amount: totalPot,
          handName: 'Победа фолдом',
          handRank: 0,
          bestCards: winner.cards
        }],
        communityCards: [...this.communityCards]
      };

      this.stage = 'SHOWDOWN';
      this.currentTurnSeat = null;
      this.notifyStateChange();
      this.triggerHandFinished(this.handResult.winners);
      this.scheduleNextHand(4000);
      return true;
    }

    return false;
  }

  private setCurrentTurn(seatIndex: number | null): void {
    this.currentTurnSeat = seatIndex;
    this.turnStartTime = seatIndex !== null ? Date.now() : null;

    if (seatIndex !== null) {
      this.turnTimer = setTimeout(() => {
        this.handleTurnTimeout();
      }, this.turnTimeLimit * 1000);
    }
  }

  private handleTurnTimeout(): void {
    if (this.currentTurnSeat === null) return;
    const player = this.seats[this.currentTurnSeat];
    if (!player) return;

    const callDiff = this.currentBet - player.currentBet;
    if (callDiff === 0) {
      this.handleAction(player.id, 'CHECK');
    } else {
      this.handleAction(player.id, 'FOLD');
    }
  }

  private checkBotTurn(): void {
    if (this.currentTurnSeat === null || this.status !== 'IN_PROGRESS') return;
    const player = this.seats[this.currentTurnSeat];
    if (!player || !player.isBot) return;

    // AI Bot decision with 1-2s human-like delay
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      if (this.currentTurnSeat !== player.seatIndex) return;
      this.executeBotAction(player);
    }, delay);
  }

  private executeBotAction(player: Player): void {
    const callDiff = this.currentBet - player.currentBet;

    // If can check for free
    if (callDiff === 0) {
      const rand = Math.random();
      if (rand < 0.25 && player.chips > this.minRaise) {
        // 25% chance to bet
        this.handleAction(player.id, 'BET', this.currentBet + this.minRaise);
      } else {
        this.handleAction(player.id, 'CHECK');
      }
      return;
    }

    // Facing a bet
    const potSize = this.pots.reduce((sum, p) => sum + p.amount, 0) + this.currentBet;
    const potOdds = callDiff / (potSize + callDiff);

    const rand = Math.random();
    if (callDiff <= player.chips * 0.15 || potOdds < 0.3) {
      // Cheap call
      if (rand < 0.75) {
        this.handleAction(player.id, 'CALL');
      } else if (rand < 0.9 && player.chips > this.currentBet + this.minRaise) {
        this.handleAction(player.id, 'RAISE', this.currentBet + this.minRaise);
      } else {
        this.handleAction(player.id, 'FOLD');
      }
    } else {
      // Expensive bet
      if (rand < 0.35) {
        this.handleAction(player.id, 'CALL');
      } else if (rand < 0.45 && player.chips > this.currentBet + this.minRaise) {
        this.handleAction(player.id, 'RAISE', this.currentBet + this.minRaise);
      } else {
        this.handleAction(player.id, 'FOLD');
      }
    }
  }

  private getNextActiveSeat(fromSeat: number): number {
    let seat = (fromSeat + 1) % this.maxSeats;
    let attempts = 0;
    while (attempts < this.maxSeats) {
      const p = this.seats[seat];
      if (p && p.status !== 'SITTING_OUT') {
        return seat;
      }
      seat = (seat + 1) % this.maxSeats;
      attempts++;
    }
    return fromSeat;
  }

  private getNextActionSeat(fromSeat: number): number {
    let seat = (fromSeat + 1) % this.maxSeats;
    let attempts = 0;
    while (attempts < this.maxSeats) {
      const p = this.seats[seat];
      if (p && p.status === 'ACTIVE') {
        return seat;
      }
      seat = (seat + 1) % this.maxSeats;
      attempts++;
    }
    return fromSeat;
  }

  private clearTimers(): void {
    this.clearTurnTimer();
    if (this.nextHandTimer) {
      clearTimeout(this.nextHandTimer);
      this.nextHandTimer = null;
    }
  }

  private clearTurnTimer(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }
}
