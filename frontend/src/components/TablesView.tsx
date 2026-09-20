import React, { useState } from 'react';
import { TableSummary } from '../types';
import { haptic } from '../utils/telegram';
import { Play, Eye, PlusCircle, Crown, Lock } from 'lucide-react';

interface TablesViewProps {
  tables: TableSummary[];
  onSelectTable: (tableId: string, autoJoin?: boolean) => void;
  userChips: number;
  totalStarsPurchased?: number;
  onOpenShop?: () => void;
  onOpenVipModal?: (table: TableSummary) => void;
}

export const TablesView: React.FC<TablesViewProps> = ({
  tables,
  onSelectTable,
  userChips,
  totalStarsPurchased = 0,
  onOpenShop,
  onOpenVipModal
}) => {
  const [filter, setFilter] = useState<'all' | 'micro' | 'mid' | 'high' | 'vip'>('all');

  const filteredTables = tables.filter((t) => {
    const isVip = !!t.isVip || (t.minStarsRequired !== undefined && t.minStarsRequired > 0);
    if (filter === 'vip') return isVip;
    if (filter === 'micro') return !isVip && t.smallBlind <= 30;
    if (filter === 'mid') return !isVip && t.smallBlind > 30 && t.smallBlind <= 200;
    if (filter === 'high') return !isVip && t.smallBlind > 200;
    return true;
  });

  return (
    <div className="flex flex-col gap-3.5 p-4 pb-28 animate-fadeIn select-none">
      
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Все столы' },
          { id: 'micro', label: '🥉 Микро (5-30)' },
          { id: 'mid', label: '🥈 Средние (50-200)' },
          { id: 'high', label: '🥇 Высокие (300+)' },
          { id: 'vip', label: '👑 VIP (100⭐️)' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              haptic.light();
              setFilter(item.id as any);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === item.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-white/[0.06]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="flex flex-col gap-3">
        {filteredTables.map((table) => {
          const isVip = !!table.isVip || (table.minStarsRequired !== undefined && table.minStarsRequired > 0);
          const minStars = table.minStarsRequired || 100;
          const hasVipAccess = !isVip || totalStarsPurchased >= minStars;
          const canAfford = userChips >= table.minBuyIn;
          const isFull = table.playersCount >= table.maxSeats;

          return (
            <div
              key={table.id}
              className={`glass-card rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 relative overflow-hidden group ${
                isVip
                  ? 'border-amber-500/30 bg-gradient-to-br from-[#120d04] via-[#090d16] to-[#04070d] hover:border-amber-500/60 shadow-[0_4px_20px_rgba(245,158,11,0.06)]'
                  : 'hover:border-amber-500/40'
              }`}
            >
              {/* Top Row: Name, Badge, Blinds */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                      {table.name}
                    </span>
                    {isVip && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                        <Crown className="w-3 h-3 text-amber-400" />
                        VIP 100⭐️
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-amber-400">
                    Блайнды: ${table.smallBlind.toLocaleString()} / ${table.bigBlind.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Бай-ин
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    ${table.minBuyIn.toLocaleString()} — ${table.maxBuyIn.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Bottom Row: Player Seats & Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                {/* Seats visual dots */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: table.maxSeats }).map((_, idx) => {
                      const isOccupied = idx < table.playersCount;
                      return (
                        <div
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            isOccupied
                              ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                              : 'bg-slate-800 border border-slate-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {table.playersCount} / {table.maxSeats} мест
                  </span>
                </div>

                {/* Actions: Play / Watch / VIP Lock */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      haptic.light();
                      onSelectTable(table.id, false);
                    }}
                    className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 active:scale-95 transition-all flex items-center gap-1 text-xs"
                    title="Смотреть стол"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Смотреть</span>
                  </button>

                  {/* If VIP and user does not have 100 stars purchased */}
                  {isVip && !hasVipAccess ? (
                    <button
                      onClick={() => {
                        haptic.medium();
                        if (onOpenVipModal) {
                          onOpenVipModal(table);
                        } else if (onOpenShop) {
                          onOpenShop();
                        }
                      }}
                      className="px-3 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-300/40 shadow-amber-950/40"
                      title="Требуется покупка от 100 Stars"
                    >
                      <Lock className="w-3 h-3" />
                      <span>100⭐️ VIP</span>
                    </button>
                  ) : canAfford && !isFull ? (
                    <button
                      onClick={() => {
                        haptic.medium();
                        onSelectTable(table.id, true);
                      }}
                      className="px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border border-emerald-400/30 shadow-emerald-950/40"
                    >
                      <span>Играть</span>
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  ) : isFull ? (
                    <button
                      onClick={() => {
                        haptic.light();
                        onSelectTable(table.id, false);
                      }}
                      className="px-3 py-2 rounded-xl font-bold text-xs bg-slate-900 text-slate-500 border border-slate-800 cursor-default"
                    >
                      Стол заполнен
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        haptic.light();
                        if (onOpenShop) onOpenShop();
                      }}
                      className="px-3 py-2 rounded-xl font-bold text-xs bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Пополнить</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

