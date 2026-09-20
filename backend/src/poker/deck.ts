import crypto from 'crypto';
import { Card, Rank, Suit } from '../types/poker.js';

const SUITS: Suit[] = ['h', 'd', 'c', 's'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({
          rank,
          suit,
          code: `${rank}${suit}`
        });
      }
    }
    this.shuffle();
  }

  public shuffle(): void {
    // Fisher-Yates with crypto.randomInt
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      const temp = this.cards[i];
      this.cards[i] = this.cards[j];
      this.cards[j] = temp;
    }
  }

  public draw(count: number = 1): Card[] {
    if (this.cards.length < count) {
      throw new Error(`Cannot draw ${count} cards. Deck only has ${this.cards.length} left.`);
    }
    return this.cards.splice(0, count);
  }

  public remaining(): number {
    return this.cards.length;
  }
}
