declare module 'pokersolver' {
  export class Hand {
    static solve(cards: string[]): any;
    static winners(hands: any[]): any[];
  }
  const pokersolver: {
    Hand: typeof Hand;
  };
  export default pokersolver;
}
