import React from 'react';
import { ChipStack } from './ChipStack';
import { Trophy, Crown, Medal, Award, Flame } from 'lucide-react';

interface LeaderboardViewProps {
  leaderboard: { id: string; name: string; chips: number; handsWon: number }[];
  currentUserId: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboard,
  currentUserId
}) => {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="flex flex-col gap-4 p-4 pb-28 animate-fadeIn select-none">
      {/* Title & Banner */}
      <div className="flex flex-col items-center text-center gap-1">
        <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Таблица Лидеров</span>
        </h2>
        <p className="text-xs text-slate-400">
          Лучшие игроки клуба по количеству игровых фишек
        </p>
      </div>

      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2 px-1">
          
          {/* Rank 2 (Silver) */}
          {top3[1] ? (
            <div className="glass-card rounded-2xl p-3 flex flex-col items-center gap-1.5 order-1 border-slate-500/30">
              <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                2
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-bold text-xs text-slate-300">
                  {top3[1].name.replace('@', '').substring(0, 2).toUpperCase()}
                </div>
              </div>
              <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">
                {top3[1].name}
              </span>
              <ChipStack amount={top3[1].chips} size="sm" />
            </div>
          ) : <div className="order-1" />}

          {/* Rank 1 (Gold) */}
          {top3[0] && (
            <div className="glass-card rounded-2xl p-4 flex flex-col items-center gap-1.5 order-2 border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] relative -translate-y-2">
              <div className="absolute -top-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg border border-white">
                <Crown className="w-3 h-3 fill-slate-950" />
                <span>ТОП-1</span>
              </div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 p-0.5 shadow-lg shadow-amber-500/30 mt-1">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-black text-sm text-amber-300">
                  {top3[0].name.replace('@', '').substring(0, 2).toUpperCase()}
                </div>
              </div>
              <span className="text-xs font-black text-amber-300 truncate max-w-[95px]">
                {top3[0].name}
              </span>
              <ChipStack amount={top3[0].chips} size="md" className="scale-105" />
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] ? (
            <div className="glass-card rounded-2xl p-3 flex flex-col items-center gap-1.5 order-3 border-amber-800/40">
              <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow">
                3
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-700 to-amber-900 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-bold text-xs text-amber-500">
                  {top3[2].name.replace('@', '').substring(0, 2).toUpperCase()}
                </div>
              </div>
              <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">
                {top3[2].name}
              </span>
              <ChipStack amount={top3[2].chips} size="sm" />
            </div>
          ) : <div className="order-3" />}

        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="flex flex-col gap-2">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            Загрузка таблицы лидеров...
          </div>
        ) : (
          leaderboard.map((player, idx) => {
            const isMe = player.id === currentUserId;

            return (
              <div
                key={player.id}
                className={`glass-card rounded-xl p-3 flex items-center justify-between transition-all ${
                  isMe ? 'border-amber-400/60 bg-amber-950/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-mono font-black text-xs ${
                    idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    #{idx + 1}
                  </span>

                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isMe ? 'text-amber-300' : 'text-slate-200'}`}>
                      {player.name} {isMe && '(Вы)'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Побед: <b className="text-slate-300">{player.handsWon}</b>
                    </span>
                  </div>
                </div>

                <ChipStack amount={player.chips} size="sm" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
