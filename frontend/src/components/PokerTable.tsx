import React, { useEffect, useRef, useState } from 'react';
import { TableState } from '../types';
import { PlayerSeat } from './PlayerSeat';
import { CardView } from './CardView';
import { BuyInModal } from './BuyInModal';
import { LeaveConfirmModal } from './LeaveConfirmModal';
import { sounds } from '../utils/sound';
import { haptic } from '../utils/telegram';
import { Menu, Plus, Trophy, Volume2, VolumeX, Eye, UserPlus, Smile, MessageSquare } from 'lucide-react';
import { TableReactions } from './TableReactions';

interface PokerTableProps {
  tableState: TableState;
  currentUserId: string;
  userChips: number;
  userTonBalance?: number;
  onLeave: () => void;
  onJoin: (seatIndex: number, buyIn: number) => void;
  onOpenShop: () => void;
  onOpenReferral?: () => void;
  isJoining?: boolean;
  reactions?: Record<number, string>;
  onSendReaction?: (emoji: string) => void;
  reactionCooldown?: boolean;
}

// 6-Max Mobile Portrait Coordinates
const SEAT_POSITIONS = [
  'bottom-2 left-1/2 -translate-x-1/2',                         // Seat 0: Hero / Bottom center
  'bottom-[22%] left-[10%] -translate-x-1/2 -translate-y-1/2',  // Seat 1: Bottom left
  'top-[18%] left-[10%] -translate-x-1/2 -translate-y-1/2',     // Seat 2: Top left
  'top-2 left-1/2 -translate-x-1/2',                            // Seat 3: Top center
  'top-[18%] left-[90%] -translate-x-1/2 -translate-y-1/2',     // Seat 4: Top right
  'bottom-[22%] left-[90%] -translate-x-1/2 -translate-y-1/2'   // Seat 5: Bottom right
];

export const PokerTable: React.FC<PokerTableProps> = ({
  tableState,
  currentUserId,
  userChips,
  userTonBalance = 0,
  onLeave,
  onJoin,
  onOpenShop,
  onOpenReferral,
  isJoining = false,
  reactions = {},
  onSendReaction,
  reactionCooldown = false
}) => {
  const prevCardCount = useRef<number>(0);
  const prevTotalPot = useRef<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted());

  // Modals
  const [buyInModalOpen, setBuyInModalOpen] = useState<boolean>(false);
  const [targetSeatIndex, setTargetSeatIndex] = useState<number | null>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState<boolean>(false);
  const [reactionModalOpen, setReactionModalOpen] = useState<boolean>(false);

  const myPlayer = tableState.seats.find(p => p?.id === currentUserId) || null;
  const isSpectating = !myPlayer;
  const mySeatIndex = myPlayer ? myPlayer.seatIndex : null;
  const activePlayersCount = tableState.seats.filter(Boolean).length;

  // Play sound effects when cards are dealt or pot grows
  useEffect(() => {
    if (tableState.communityCards.length > prevCardCount.current) {
      sounds.playDeal();
    } else if (tableState.communityCards.length === 0 && prevCardCount.current > 0) {
      sounds.playCollect();
    }
    prevCardCount.current = tableState.communityCards.length;

    if (tableState.totalPot > prevTotalPot.current && prevTotalPot.current > 0) {
      sounds.playChip();
    }
    prevTotalPot.current = tableState.totalPot;

    if (tableState.handResult && tableState.handResult.winners.length > 0) {
      sounds.playWin();
    }
  }, [tableState.communityCards.length, tableState.totalPot, tableState.handResult]);

  // Seat click handler
  const handleSeatClick = (seatIndex: number) => {
    if (myPlayer) return;
    haptic.medium();
    setTargetSeatIndex(seatIndex);
    setBuyInModalOpen(true);
  };

  const handleOpenAutoSeat = () => {
    const firstEmpty = tableState.seats.findIndex(s => s === null);
    if (firstEmpty !== -1) {
      handleSeatClick(firstEmpty);
    }
  };

  const handleMenuClick = () => {
    haptic.medium();
    if (myPlayer && tableState.status === 'IN_PROGRESS' && (myPlayer.status === 'ACTIVE' || myPlayer.status === 'ALL_IN')) {
      setLeaveModalOpen(true);
    } else {
      onLeave();
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden bg-[#06080d] select-none min-h-0">
      
      {/* Top Header Bar (Screenshot Match: [☰] Table #1287 Texas Hold'em · 6/9  ---  🔴 21,760 [+]) */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#080d17]/95 backdrop-blur-md border-b border-white/[0.06] z-30 shadow-lg shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Menu Hamburger Button */}
          <button
            onClick={handleMenuClick}
            className="w-8 h-8 rounded-xl bg-[#121927] hover:bg-[#1a2438] active:scale-95 text-slate-300 flex items-center justify-center border border-slate-700/60 shadow transition"
            title="Меню"
          >
            <Menu className="w-4 h-4 text-slate-200" />
          </button>

          {/* Table Title & Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                {tableState.name || `Table #${tableState.id ? tableState.id.substring(0, 4) : '1287'}`}
              </span>
              {tableState.currency === 'TON' ? (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm whitespace-nowrap">
                  💎 TON
                </span>
              ) : tableState.isVip ? (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm whitespace-nowrap">
                  👑 VIP {tableState.minStarsRequired || 10}⭐️
                </span>
              ) : null}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 leading-tight">
              Texas Hold'em · {activePlayersCount}/{tableState.seats.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
              haptic.light();
            }}
            className="p-1 rounded-lg bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 active:scale-95 transition"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-slate-300" />}
          </button>

          {/* Chips / TON Pill with Icon and Green [+] Button */}
          <div className="flex items-center gap-1.5 bg-[#0e1624] border border-white/[0.08] rounded-full pl-2 pr-1 py-1 shadow-inner">
            {tableState.currency === 'TON' ? (
              <>
                <span className="text-xs">💎</span>
                <span className="text-xs font-black font-mono text-cyan-300 pr-0.5">
                  {(userTonBalance || 0).toFixed(2)}
                </span>
              </>
            ) : (
              <>
                {/* Red Chip Icon */}
                <div className="w-4 h-4 rounded-full bg-red-600 border border-white/80 flex items-center justify-center shadow-sm">
                  <div className="w-2 h-2 rounded-full border border-dashed border-white/80" />
                </div>
                
                <span className="text-xs font-black font-mono text-white pr-0.5">
                  {userChips.toLocaleString()}
                </span>
              </>
            )}

            {/* Green [+] Button */}
            <button
              onClick={onOpenShop}
              className="w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-md transition"
              title={tableState.currency === 'TON' ? 'Пополнить TON' : 'Купить фишки за Telegram Stars'}
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* Spectator Floating Bar */}
      {isSpectating && (
        <div className="bg-slate-900/95 border-b border-white/[0.08] px-3.5 py-1.5 flex items-center justify-between z-20 text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Вы наблюдаете за игрой</span>
          </div>
          <button
            onClick={handleOpenAutoSeat}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all shadow border border-emerald-400/40"
          >
            <UserPlus className="w-3 h-3" />
            <span>Занять место</span>
          </button>
        </div>
      )}

      {/* Main Table Felt Arena (Mobile Portrait Oval) */}
      <div className="relative flex-1 flex items-center justify-center p-1 sm:p-2 min-h-0">
        
        {/* Outer Wooden & Leather Rail */}
        <div className="relative w-full max-w-[420px] h-full max-h-[560px] aspect-[3/4] sm:aspect-[4/5] rounded-[130px] sm:rounded-[170px] bg-gradient-to-b from-[#1c1f26] via-[#12161c] to-[#0a0d12] p-2 sm:p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_2px_4px_rgba(255,255,255,0.1)] border-4 border-[#242b38] flex items-center justify-center">
          
          {/* Inner Golden/Brass Rim with Soft Glow (Screenshot Match) */}
          <div className="w-full h-full rounded-[120px] sm:rounded-[160px] p-1.5 bg-[#061e13] shadow-[inset_0_0_20px_rgba(0,0,0,0.9),0_0_15px_rgba(245,158,11,0.25)] border-2 border-amber-500/40 flex items-center justify-center">
            
            {/* Emerald Green Felt with Radial Dark Vignette */}
            <div className="relative w-full h-full rounded-[114px] sm:rounded-[154px] bg-[radial-gradient(ellipse_at_center,_#0f5433_0%,_#093821_45%,_#03180e_100%)] shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center overflow-hidden">
              
              {/* Table Pattern & Watermark */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

              {/* Center Board Area: Pot, 5 Community Cards, and 3D Chip Pile */}
              <div className="relative z-10 flex flex-col items-center -translate-y-2">
                
                {/* Pot Display (Screenshot Match: "Pot" + Blue Chip + Amount) */}
                <div className="flex flex-col items-center mb-1.5">
                  <span className="text-[10px] text-slate-300/80 font-medium">
                    Pot
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Blue Chip Icon */}
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white/80 flex items-center justify-center shadow">
                      <div className="w-1.5 h-1.5 rounded-full border border-dashed border-white/80" />
                    </div>
                    <span className="text-sm sm:text-base font-black font-mono text-white drop-shadow">
                      {tableState.totalPot > 0
                        ? tableState.currency === 'TON'
                          ? `${tableState.totalPot.toFixed(2)} TON`
                          : tableState.totalPot.toLocaleString()
                        : '0'}
                    </span>
                  </div>
                </div>

                {/* 5 Community Cards Row (Clean White Cards) */}
                <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl">
                  {tableState.communityCards.map((card, idx) => {
                    const isWinningCard = tableState.handResult?.winners.some(w =>
                      w.bestCards?.some(bc => bc.code === card.code)
                    );
                    return (
                      <CardView
                        key={`${card.code}-${idx}`}
                        card={card}
                        highlighted={isWinningCard}
                        size="md"
                        className="shadow-xl"
                      />
                    );
                  })}

                  {/* Empty Card Outline Slots */}
                  {Array.from({ length: 5 - tableState.communityCards.length }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="w-11 sm:w-12 h-16 sm:h-[68px] rounded-lg border border-dashed border-white/15 bg-black/20 flex items-center justify-center opacity-40 shadow-inner"
                    >
                      <span className="text-white/20 text-xs">♠</span>
                    </div>
                  ))}
                </div>

                {/* 3D Stack of Colored Poker Chips on Felt Below Cards (Screenshot Match) */}
                {tableState.totalPot > 0 && (
                  <div className="flex items-center justify-center -space-x-1.5 mt-2 drop-shadow-[0_6px_10px_rgba(0,0,0,0.8)]">
                    {/* Red Stack */}
                    <div className="flex flex-col -space-y-1">
                      <div className="w-4 h-2.5 rounded-full bg-red-600 border border-white/80 shadow-sm" />
                      <div className="w-4 h-2.5 rounded-full bg-red-600 border border-white/80 shadow-sm" />
                    </div>
                    {/* Blue Stack */}
                    <div className="flex flex-col -space-y-1">
                      <div className="w-4 h-2.5 rounded-full bg-blue-600 border border-white/80 shadow-sm" />
                      <div className="w-4 h-2.5 rounded-full bg-blue-600 border border-white/80 shadow-sm" />
                    </div>
                    {/* Black Stack */}
                    <div className="flex flex-col -space-y-1">
                      <div className="w-4 h-2.5 rounded-full bg-zinc-800 border border-white/80 shadow-sm" />
                      <div className="w-4 h-2.5 rounded-full bg-zinc-800 border border-white/80 shadow-sm" />
                    </div>
                  </div>
                )}

                {/* Winner Celebration Banner */}
                {tableState.handResult && tableState.handResult.winners.length > 0 && (
                  <div className="animate-bounce mt-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 px-3 py-1 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.9)] border-2 border-white flex items-center gap-1.5 text-[11px] font-black max-w-[280px] truncate">
                    <Trophy className="w-3.5 h-3.5 text-slate-950 fill-slate-950 shrink-0" />
                    <span className="truncate">
                      {tableState.handResult.winners.map(w => `${w.playerName} (+$${w.amount.toLocaleString()})`).join(', ')}
                    </span>
                    <span className="text-[9px] font-bold text-slate-800 shrink-0">
                      • {tableState.handResult.winners[0].handName}
                    </span>
                  </div>
                )}
              </div>

              {/* 6 Player Seats (Rotated so Hero is always at Position 0 Bottom Center) */}
              {tableState.seats.map((player, index) => {
                const visualIndex = mySeatIndex !== null
                  ? (index - mySeatIndex + 6) % 6
                  : index;
                const isHero = mySeatIndex !== null && index === mySeatIndex;

                return (
                  <PlayerSeat
                    key={`seat-${index}`}
                    seatIndex={index}
                    player={player}
                    tableState={tableState}
                    currentUserId={currentUserId}
                    onJoin={() => handleSeatClick(index)}
                    positionClass={SEAT_POSITIONS[visualIndex]}
                    reaction={reactions?.[index]}
                    isHero={isHero}
                  />
                );
              })}

              {/* Floating [☺] Reaction Button (Bottom Left of Felt, Screenshot Match) */}
              <button
                onClick={() => setReactionModalOpen(prev => !prev)}
                className="absolute bottom-3 left-3 z-30 w-9 h-9 rounded-full bg-[#0d1420]/80 hover:bg-[#121c2c] text-slate-300 border border-white/10 shadow-lg active:scale-95 transition flex items-center justify-center backdrop-blur-sm"
                title="Реакции"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Floating [💬] Chat/History Button (Bottom Right of Felt, Screenshot Match) */}
              <button
                onClick={onOpenReferral}
                className="absolute bottom-3 right-3 z-30 w-9 h-9 rounded-full bg-[#0d1420]/80 hover:bg-[#121c2c] text-slate-300 border border-white/10 shadow-lg active:scale-95 transition flex items-center justify-center backdrop-blur-sm"
                title="Чат и история"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Reactions Floating Modal */}
              {myPlayer && onSendReaction && reactionModalOpen && (
                <TableReactions
                  onSelectReaction={(emoji) => {
                    onSendReaction(emoji);
                    setReactionModalOpen(false);
                  }}
                  onClose={() => setReactionModalOpen(false)}
                  cooldownActive={reactionCooldown}
                />
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Buy-In Selection Modal */}
      <BuyInModal
        isOpen={buyInModalOpen}
        onClose={() => setBuyInModalOpen(false)}
        tableState={tableState}
        userChips={userChips}
        userTonBalance={userTonBalance}
        selectedSeat={targetSeatIndex}
        onConfirmJoin={(seatIndex, buyIn) => {
          onJoin(seatIndex, buyIn);
          setBuyInModalOpen(false);
        }}
        onOpenShop={() => {
          setBuyInModalOpen(false);
          onOpenShop();
        }}
        onOpenTonWallet={() => {
          setBuyInModalOpen(false);
          onOpenShop();
        }}
        isJoining={isJoining}
      />

      {/* Leave Table Confirmation Modal */}
      <LeaveConfirmModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onConfirm={() => {
          setLeaveModalOpen(false);
          onLeave();
        }}
        isInHand={!!myPlayer && tableState.status === 'IN_PROGRESS' && (myPlayer.status === 'ACTIVE' || myPlayer.status === 'ALL_IN')}
        chipsInPlay={myPlayer?.chips || 0}
      />
    </div>
  );
};
