import React from 'react';

interface ChipStackProps {
  amount: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const formatChips = (amount: number): string => {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return amount.toString();
};

export const ChipStack: React.FC<ChipStackProps> = ({
  amount,
  showLabel = true,
  size = 'md',
  className = ''
}) => {
  if (amount <= 0) return null;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  }[size];

  // Chip theme based on value
  const getChipColors = () => {
    if (amount >= 10000) return { bg: 'from-amber-400 via-amber-500 to-amber-700', border: 'border-amber-300', dot: 'bg-amber-200' };
    if (amount >= 2500) return { bg: 'from-purple-500 via-purple-600 to-purple-800', border: 'border-purple-300', dot: 'bg-purple-200' };
    if (amount >= 500) return { bg: 'from-emerald-500 via-emerald-600 to-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-200' };
    if (amount >= 100) return { bg: 'from-blue-500 via-blue-600 to-blue-800', border: 'border-blue-300', dot: 'bg-blue-200' };
    return { bg: 'from-rose-500 via-rose-600 to-rose-800', border: 'border-rose-300', dot: 'bg-rose-200' };
  };

  const colors = getChipColors();

  return (
    <div className={`inline-flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md rounded-full border border-amber-500/30 shadow-[0_4px_12px_rgba(0,0,0,0.7)] ${sizeClasses} ${className}`}>
      {/* 3D Stack of Chips Illusion */}
      <div className="relative flex items-center shrink-0">
        {/* Under-chip shadow layer */}
        <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${colors.bg} border ${colors.border} shadow-md flex items-center justify-center relative overflow-hidden`}>
          {/* Inner ring & casino notches */}
          <div className="w-2.5 h-2.5 rounded-full border border-dashed border-white/60 flex items-center justify-center">
            <div className={`w-1 h-1 rounded-full ${colors.dot}`} />
          </div>
          {/* Glossy reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
        </div>
      </div>

      {showLabel && (
        <span className="font-mono font-bold text-amber-300 tracking-tight drop-shadow-sm">
          ${formatChips(amount)}
        </span>
      )}
    </div>
  );
};
