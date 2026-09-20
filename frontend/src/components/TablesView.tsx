import React, { useState } from 'react';
import { TableSummary } from '../types';
import { haptic } from '../utils/telegram';
import { Play, Eye, PlusCircle, Crown, Lock, Gem } from 'lucide-react';

interface TablesViewProps {
  tables: TableSummary[];
  onSelectTable: (tableId: string, autoJoin?: boolean) => void;
  userChips: number;
  userTonBalance?: number;
  totalStarsPurchased?: number;
  onOpenShop?: () => void;
  onOpenTonWallet?: () => void;
  onOpenVipModal?: (table: TableSummary) => void;
}

export const TablesView: React.FC<TablesViewProps> = ({
  tables,
  onSelectTable,
  userChips,
  userTonBalance = 0,
  totalStarsPurchased = 0,
  onOpenShop,
  onOpenTonWallet,
  onOpenVipModal
}) => {
  const [filter, setFilter] = useState<'all' | 'chips' | 'vip' | 'ton'>('all');

  const chipsCount = tables.filter(t => !t.isVip && t.currency !== 'TON').length;
  const vipCount = tables.filter(t => !!t.isVip).length;
  const tonCount = tables.filter(t => t.currency === 'TON').length;

  const filteredTables = tables.filter((t) => {
    if (filter === 'chips') return !t.isVip && t.currency !== 'TON';
    if (filter === 'vip') return !!t.isVip;
    if (filter === 'ton') return t.currency === 'TON';
    return true;
  });

  return (
    <div className="flex flex-col gap-3.5 p-4 pb-28 animate-fadeIn select-none">
      
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `Все (${tables.length})` },
          { id: 'chips', label: `🪙 Фишки (${chipsCount})` },
          { id: 'vip', label: `👑 VIP Звёзды (${vipCount})` },
          { id: 'ton', label: `💎 TON Столы (${tonCount})` },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              haptic.light();
              setFilter(item.id as any);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === item.id
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
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
          const isTon = table.currency === 'TON';
          const isVip = !!table.isVip;
          const minStars = table.minStarsRequired || 10;
          const hasVipAccess = !isVip || totalStarsPurchased >= minStars;
          const canAfford = isTon ? userTonBalance >= table.minBuyIn : userChips >= table.minBuyIn;
          const isFull = table.playersCount >= table.maxSeats;

          return (
            <div
              key={table.id}
              className={`glass-card rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 relative overflow-hidden group ${
                isTon
                  ? 'border-cyan-500/40 bg-gradient-to-br from-[#04101e] via-[#07172c] to-[#020b14] hover:border-cyan-400/70 shadow-[0_4px_25px_rgba(6,182,212,0.12)]'
                  : isVip
                  ? 'border-amber-500/40 bg-gradient-to-br from-[#171004] via-[#0e1422] to-[#05080e] hover:border-amber-400/70 shadow-[0_4px_25px_rgba(245,158,11,0.12)]'
                  : 'hover:border-amber-500/40'
              }`}
            >
              {/* Top Row: Name, Badge, Blinds */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isTon ? 'text-cyan-100 group-hover:text-cyan-300' : 'text-slate-100 group-hover:text-amber-300'} transition-colors`}>
                      {table.name}
                    </span>
                    {isTon && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1 shadow-sm">
                        <Gem className="w-3 h-3 text-cyan-400" />
                        TON CRYPTO
                      </span>
                    )}
                    {isVip && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                        <Crown className="w-3 h-3 text-amber-400" />
                        VIP {minStars}⭐️
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-mono ${isTon ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {isTon
                      ? `Блайнды: ${table.smallBlind} / ${table.bigBlind} TON`
                      : `Блайнды: $${table.smallBlind.toLocaleString()} / $${table.bigBlind.toLocaleString()}`}
                  </span>
                </div>

                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Бай-ин
                  </span>
                  <span className={`text-xs font-mono font-bold ${isTon ? 'text-cyan-200' : 'text-slate-200'}`}>
                    {isTon
                      ? `${table.minBuyIn} — ${table.maxBuyIn} TON`
                      : `$${table.minBuyIn.toLocaleString()} — $${table.maxBuyIn.toLocaleString()}`}
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
                              ? isTon
                                ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                                : 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
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

                  {/* If VIP and user does not have required stars purchased */}
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
                      title={`Требуется покупка от ${minStars} Stars`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>{minStars}⭐️ VIP</span>
                    </button>
                  ) : canAfford && !isFull ? (
                    <button
                      onClick={() => {
                        haptic.medium();
                        onSelectTable(table.id, true);
                      }}
                      className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 text-white ${
                        isTon
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 shadow-cyan-950/40'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-400/30 shadow-emerald-950/40'
                      }`}
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
                  ) : isTon ? (
                    <button
                      onClick={() => {
                        haptic.light();
                        if (onOpenTonWallet) onOpenTonWallet();
                      }}
                      className="px-3 py-2 rounded-xl font-bold text-xs bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Gem className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Пополнить TON</span>
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
