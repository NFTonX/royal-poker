import React from 'react';
import { Card } from '../types';

export interface CardViewProps {
  card?: Card | null;
  hidden?: boolean;
  highlighted?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  cardBack?: string;
}

// Vector SVG Suits matching authentic casino cards
const SuitSvg: React.FC<{ suit: string; className?: string }> = ({ suit, className = 'w-3 h-3' }) => {
  switch (suit) {
    case 'h': // Hearts (Red)
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} text-red-600`}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'd': // Diamonds (Red)
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} text-red-600`}>
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
        </svg>
      );
    case 'c': // Clubs (Black)
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} text-slate-950`}>
          <path d="M19.5 9.5c-1.1 0-2.06.6-2.58 1.48-.48-.88-1.44-1.48-2.54-1.48-.13 0-.25.02-.38.04C14.07 8.54 14.5 7.33 14.5 6c0-2.48-2.02-4.5-4.5-4.5S5.5 3.52 5.5 6c0 1.33.43 2.54 1.16 3.54-.13-.02-.25-.04-.38-.04-1.1 0-2.06.6-2.54 1.48C3.22 10.1 2.26 9.5 1.16 9.5 0.52 9.5 0 10.02 0 10.66c0 2.22 1.58 4.07 3.67 4.44L2.5 21h15l-1.17-5.9c2.09-.37 3.67-2.22 3.67-4.44 0-.64-.52-1.16-1.16-1.16z" transform="scale(0.85) translate(2, 2)" />
        </svg>
      );
    case 's': // Spades (Black)
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} text-slate-950`}>
          <path d="M12 2C9.5 5.5 4 10.5 4 14c0 3 2.5 5 5 5 1.5 0 2.8-.7 3-1.8.2 1.1 1.5 1.8 3 1.8 2.5 0 5-2 5-5 0-3.5-5.5-8.5-8-12zM10.5 21h3l-1.5-3-1.5 3z" />
        </svg>
      );
    default:
      return null;
  }
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  hidden = false,
  highlighted = false,
  size = 'md',
  className = '',
  cardBack = 'card_sapphire'
}) => {
  // Dimensions & font scaling
  const sizeConfig = {
    xs: {
      wrapper: 'w-6 h-9 rounded-sm',
      rankText: 'text-[9px] leading-none font-black',
      suitSize: 'w-2 h-2',
      centerSuit: 'w-3 h-3',
      padding: 'p-0.5'
    },
    sm: {
      wrapper: 'w-8 h-12 rounded-md',
      rankText: 'text-[11px] leading-none font-black',
      suitSize: 'w-2.5 h-2.5',
      centerSuit: 'w-4 h-4',
      padding: 'p-0.5'
    },
    md: {
      wrapper: 'w-11 sm:w-12 h-16 sm:h-[68px] rounded-lg',
      rankText: 'text-sm sm:text-base leading-none font-black',
      suitSize: 'w-3 h-3',
      centerSuit: 'w-6 h-6',
      padding: 'p-1'
    },
    lg: {
      wrapper: 'w-16 sm:w-18 h-[96px] sm:h-[108px] rounded-xl',
      rankText: 'text-xl sm:text-2xl leading-none font-black',
      suitSize: 'w-4 h-4',
      centerSuit: 'w-9 h-9 sm:w-10 sm:h-10',
      padding: 'p-1.5'
    }
  }[size];

  // Hidden Card Back (Casino Blue with Diamond Crosshatch and White Border)
  if (hidden || !card) {
    return (
      <div
        className={`relative ${sizeConfig.wrapper} bg-gradient-to-br from-[#1d3f7a] via-[#122850] to-[#0a1833] border border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden select-none shrink-0 transition-transform duration-200 ${className}`}
      >
        {/* Subtle patterned crosshatch */}
        <div className="absolute inset-0.5 rounded-sm border border-blue-300/40 bg-[radial-gradient(#ffffff_0.8px,transparent_0.8px)] [background-size:4px_4px] opacity-25" />
        <div className="w-1/2 h-1/2 rounded border border-white/30 bg-blue-950/60 flex items-center justify-center shadow-inner relative z-10">
          <span className="text-blue-300 text-[10px] font-black">♠</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const textColor = isRed ? 'text-red-600' : 'text-slate-950';

  return (
    <div
      className={`relative ${sizeConfig.wrapper} bg-white border ${
        highlighted
          ? 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)] scale-105 z-20'
          : 'border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.4)]'
      } flex flex-col justify-between ${sizeConfig.padding} select-none shrink-0 transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Top Left Rank & Suit */}
      <div className="flex flex-col items-center leading-none z-10">
        <span className={`${sizeConfig.rankText} ${textColor} font-sans tracking-tight`}>
          {card.rank}
        </span>
        <SuitSvg suit={card.suit} className={`${sizeConfig.suitSize} mt-0.5`} />
      </div>

      {/* Center Large Suit */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <SuitSvg
          suit={card.suit}
          className={`${sizeConfig.centerSuit} opacity-90 transition-opacity`}
        />
      </div>

      {/* Bottom Right Rank & Suit (inverted) */}
      <div className="flex flex-col items-center leading-none rotate-180 self-end z-10">
        <span className={`${sizeConfig.rankText} ${textColor} font-sans tracking-tight`}>
          {card.rank}
        </span>
        <SuitSvg suit={card.suit} className={`${sizeConfig.suitSize} mt-0.5`} />
      </div>

      {/* Glossy top reflection */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/5 pointer-events-none" />
    </div>
  );
};
