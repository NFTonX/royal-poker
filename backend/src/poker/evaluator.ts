import pkg from 'pokersolver';
import { Card, HandResultWinner, Player } from '../types/poker.js';

const { Hand } = pkg as any;

export class PokerEvaluator {
  /**
   * Evaluates the best 5-card hand from hole cards + community cards
   */
  public static evaluateHand(holeCards: Card[], communityCards: Card[]): {
    handName: string;
    handRank: number;
    description: string;
    bestCards: Card[];
    rawHand: any;
  } {
    const allCards = [...holeCards, ...communityCards].map(c => c.code);
    const solved = Hand.solve(allCards);

    // Map best cards back to Card objects
    const bestCards: Card[] = (solved.cards || []).map((c: any) => ({
      rank: c.value as any,
      suit: c.suit as any,
      code: `${c.value}${c.suit}`
    }));

    return {
      handName: solved.name,
      handRank: solved.rank,
      description: solved.descr,
      bestCards,
      rawHand: solved
    };
  }

  /**
   * Determines winners among eligible active players
   */
  public static determineWinners(
    players: Player[],
    communityCards: Card[],
    potAmount: number
  ): HandResultWinner[] {
    if (players.length === 0) return [];
    
    // If only one player hasn't folded, they win by default
    if (players.length === 1) {
      return [{
        playerId: players[0].id,
        playerName: players[0].name,
        amount: potAmount,
        handName: 'Last Player Standing',
        handRank: 0,
        bestCards: players[0].cards
      }];
    }

    // Evaluate hand for each player
    const evaluated = players.map(player => {
      const evaluation = this.evaluateHand(player.cards, communityCards);
      evaluation.rawHand.player = player;
      return {
        player,
        ...evaluation
      };
    });

    const handsToCompare = evaluated.map(e => e.rawHand);
    const winningHands = Hand.winners(handsToCompare);

    const share = Math.floor(potAmount / winningHands.length);
    const remainder = potAmount % winningHands.length;

    return winningHands.map((wh: any, index: number) => {
      const p: Player = wh.player;
      return {
        playerId: p.id,
        playerName: p.name,
        amount: share + (index === 0 ? remainder : 0),
        handName: wh.descr || wh.name,
        handRank: wh.rank,
        bestCards: (wh.cards || []).map((c: any) => ({
          rank: c.value as any,
          suit: c.suit as any,
          code: `${c.value}${c.suit}`
        }))
      };
    });
  }
}
