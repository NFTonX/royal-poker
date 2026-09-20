import { Tournament, TournamentPlayer } from '../types/poker.js';
import { PokerTable } from './table.js';
import { db } from '../db/database.js';

const BLIND_LEVELS = [
  { sb: 10, bb: 20 },
  { sb: 20, bb: 40 },
  { sb: 50, bb: 100 },
  { sb: 100, bb: 200 },
  { sb: 200, bb: 400 },
  { sb: 400, bb: 800 },
  { sb: 800, bb: 1600 }
];

const BOT_NAMES = [
  'Алексей 🤖', 'Елена 🤖', 'Михаил 🤖', 'Анна 🤖',
  'Максим 🤖', 'София 🤖', 'Артем 🤖', 'Дарья 🤖'
];

export class TournamentManager {
  private tournaments: Map<string, Tournament> = new Map();
  private tables: Map<string, PokerTable> = new Map();
  private blindTimers: Map<string, NodeJS.Timeout> = new Map();
  private onStateChangeCallback?: () => void;

  constructor() {
    this.initTournaments();
  }

  public setOnStateChange(cb: () => void): void {
    this.onStateChangeCallback = cb;
  }

  private notifyChange(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback();
    }
  }

  private initTournaments(): void {
    const templates = [
      { id: 'tour_sng_bronze', name: '🥉 Sit & Go Бронзовый', buyIn: 1000, prizePool: 6000 },
      { id: 'tour_sng_silver', name: '🥈 Sit & Go Серебряный', buyIn: 5000, prizePool: 30000 },
      { id: 'tour_sng_gold', name: '🥇 Sit & Go Золотой', buyIn: 25000, prizePool: 150000 }
    ];

    for (const t of templates) {
      this.tournaments.set(t.id, {
        id: t.id,
        name: t.name,
        buyIn: t.buyIn,
        prizePool: t.prizePool,
        maxPlayers: 6,
        status: 'REGISTRATION',
        players: [],
        currentBlindIndex: 0,
        nextBlindTime: 0
      });
    }
  }

  public getTournaments(): Tournament[] {
    return Array.from(this.tournaments.values());
  }

  public getTournament(id: string): Tournament | undefined {
    return this.tournaments.get(id);
  }

  public getTable(tournamentId: string): PokerTable | undefined {
    return this.tables.get(tournamentId);
  }

  public registerPlayer(
    tournamentId: string,
    user: { id: string; name: string; username?: string }
  ): { success: boolean; message: string; tournament?: Tournament } {
    const tour = this.tournaments.get(tournamentId);
    if (!tour) return { success: false, message: 'Турнир не найден' };

    if (tour.status !== 'REGISTRATION') {
      return { success: false, message: 'Регистрация в турнир закрыта' };
    }

    if (tour.players.some(p => p.id === user.id)) {
      return { success: false, message: 'Вы уже зарегистрированы в этом турнире' };
    }

    if (tour.players.length >= tour.maxPlayers) {
      return { success: false, message: 'В турнире нет свободных мест' };
    }

    // Deduct buy-in
    const deducted = db.deductChips(user.id, tour.buyIn);
    if (!deducted) {
      return { success: false, message: 'Недостаточно фишек для бай-ина' };
    }

    const newPlayer: TournamentPlayer = {
      id: user.id,
      name: user.name,
      chips: 3000,
      seatIndex: tour.players.length,
      eliminated: false
    };

    tour.players.push(newPlayer);
    this.notifyChange();

    // If reached 6 players, start!
    if (tour.players.length >= tour.maxPlayers) {
      this.startTournament(tour);
    }

    return {
      success: true,
      message: `Вы успешно зарегистрировались в турнире «${tour.name}»!`,
      tournament: tour
    };
  }

  public unregisterPlayer(tournamentId: string, userId: string): { success: boolean; message: string } {
    const tour = this.tournaments.get(tournamentId);
    if (!tour) return { success: false, message: 'Турнир не найден' };

    if (tour.status !== 'REGISTRATION') {
      return { success: false, message: 'Нельзя отменить регистрацию во время турнира' };
    }

    const idx = tour.players.findIndex(p => p.id === userId);
    if (idx === -1) return { success: false, message: 'Вы не зарегистрированы' };

    tour.players.splice(idx, 1);
    // Refund buy-in
    db.updateChips(userId, tour.buyIn);
    this.notifyChange();

    return { success: true, message: 'Регистрация успешно отменена, фишки возвращены' };
  }

  public fillWithBots(tournamentId: string): void {
    const tour = this.tournaments.get(tournamentId);
    if (!tour || tour.status !== 'REGISTRATION') return;

    let botIdx = 0;
    while (tour.players.length < tour.maxPlayers) {
      const botName = BOT_NAMES[botIdx % BOT_NAMES.length];
      tour.players.push({
        id: `bot_tour_${Date.now()}_${botIdx}`,
        name: botName,
        chips: 3000,
        seatIndex: tour.players.length,
        isBot: true,
        eliminated: false
      });
      botIdx++;
    }

    this.notifyChange();
    this.startTournament(tour);
  }

  private startTournament(tour: Tournament): void {
    tour.status = 'RUNNING';
    tour.currentBlindIndex = 0;
    tour.nextBlindTime = Date.now() + 120000; // 2 minutes per level

    const blinds = BLIND_LEVELS[0];
    const table = new PokerTable({
      id: `table_${tour.id}`,
      name: tour.name,
      smallBlind: blinds.sb,
      bigBlind: blinds.bb,
      minBuyIn: 3000,
      maxBuyIn: 3000,
      maxSeats: 6,
      turnTimeLimit: 15
    });

    // Seat all tournament players
    for (let i = 0; i < tour.players.length; i++) {
      const tp = tour.players[i];
      table.joinTable({
        id: tp.id,
        name: tp.name,
        chips: 3000,
        isBot: tp.isBot
      }, i);
    }

    // Schedule blind increases
    this.scheduleNextBlind(tour, table);

    // Watch for busted players to handle elimination ranks
    table.setOnPlayerBusted((bustedPlayer) => {
      const tp = tour.players.find(p => p.id === bustedPlayer.id);
      if (tp && !tp.eliminated) {
        tp.eliminated = true;
        const remaining = tour.players.filter(p => !p.eliminated);
        tp.rank = remaining.length + 1; // e.g. 6th, 5th, etc.

        // If only 1 player remaining, they are the winner!
        if (remaining.length === 1) {
          const winner = remaining[0];
          winner.rank = 1;
          this.finishTournament(tour, winner, tp);
        }
      }
    });

    this.tables.set(tour.id, table);
    this.notifyChange();
  }

  private scheduleNextBlind(tour: Tournament, table: PokerTable): void {
    const timer = setTimeout(() => {
      if (tour.status !== 'RUNNING') return;
      tour.currentBlindIndex = Math.min(tour.currentBlindIndex + 1, BLIND_LEVELS.length - 1);
      const newBlinds = BLIND_LEVELS[tour.currentBlindIndex];
      table.smallBlind = newBlinds.sb;
      table.bigBlind = newBlinds.bb;
      tour.nextBlindTime = Date.now() + 120000;
      this.notifyChange();
      this.scheduleNextBlind(tour, table);
    }, 120000);

    this.blindTimers.set(tour.id, timer);
  }

  private finishTournament(tour: Tournament, winner: TournamentPlayer, runnerUp: TournamentPlayer): void {
    tour.status = 'FINISHED';
    tour.winnerId = winner.id;

    // Clear blind timer
    const bt = this.blindTimers.get(tour.id);
    if (bt) clearTimeout(bt);
    this.blindTimers.delete(tour.id);

    // Prizes: 1st place 70%, 2nd place 30%
    const firstPrize = Math.round(tour.prizePool * 0.7);
    const secondPrize = Math.round(tour.prizePool * 0.3);

    if (!winner.isBot) {
      db.updateChips(winner.id, firstPrize);
      db.addXp(winner.id, 500);
      db.checkAchievements(winner.id, 'tournament', 1);
    }

    if (!runnerUp.isBot) {
      db.updateChips(runnerUp.id, secondPrize);
      db.addXp(runnerUp.id, 250);
      db.checkAchievements(runnerUp.id, 'tournament', 1);
    }

    // Award participation achievement
    for (const p of tour.players) {
      if (!p.isBot) {
        db.checkAchievements(p.id, 'tournament', 1);
      }
    }

    this.notifyChange();

    // Reset tournament after 30 seconds for next round of players
    setTimeout(() => {
      this.resetTournament(tour.id);
    }, 30000);
  }

  private resetTournament(tourId: string): void {
    const oldTour = this.tournaments.get(tourId);
    if (!oldTour) return;

    this.tables.delete(tourId);
    this.tournaments.set(tourId, {
      id: oldTour.id,
      name: oldTour.name,
      buyIn: oldTour.buyIn,
      prizePool: oldTour.prizePool,
      maxPlayers: 6,
      status: 'REGISTRATION',
      players: [],
      currentBlindIndex: 0,
      nextBlindTime: 0
    });
    this.notifyChange();
  }
}
