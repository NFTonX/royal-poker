import React from 'react';
import { Tournament, User } from '../types';

interface TournamentsViewProps {
  tournaments: Tournament[];
  user: User | null;
  onJoin: (tournamentId: string) => void;
  onLeave: (tournamentId: string) => void;
  onFillBots: (tournamentId: string) => void;
  onEnterTable?: (tableId: string) => void;
  onClose: () => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  tournaments,
  user,
  onJoin,
  onLeave,
  onFillBots,
  onEnterTable,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏟</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Sit & Go Турниры</h2>
              <p className="text-xs text-amber-400/80">Турниры на выбывание на 6 игроков</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* Tournament Cards */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {tournaments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-3xl block mb-2">⏳</span>
              <p className="text-sm">Загрузка турниров...</p>
            </div>
          ) : (
            tournaments.map((tour) => {
              const isRegistered = user ? tour.players.some(p => p.id === user.id) : false;
              const isFull = tour.players.length >= tour.maxPlayers;
              const isRunning = tour.status === 'RUNNING';

              return (
                <div
                  key={tour.id}
                  className={`p-4 rounded-xl border transition relative overflow-hidden ${
                    isRunning
                      ? 'bg-gradient-to-br from-purple-950/40 to-slate-900 border-purple-500/40'
                      : isRegistered
                      ? 'bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/70 border-white/10'
                  }`}
                >
                  {/* Status Banner */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      {tour.name}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      isRunning
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {isRunning ? 'ИДЕТ ИГРА' : 'РЕГИСТРАЦИЯ'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Бай-ин</span>
                      <span className="font-bold text-white">${tour.buyIn.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Призовой фонд</span>
                      <span className="font-bold text-amber-300">${tour.prizePool.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Игроки</span>
                      <span className="font-bold text-white">{tour.players.length} / {tour.maxPlayers}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Призы (1 / 2 место)</span>
                      <span className="font-bold text-emerald-400">70% / 30%</span>
                    </div>
                  </div>

                  {/* Registered players avatars */}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-[11px] text-gray-400 mr-1">Участники:</span>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {tour.players.map((p, idx) => (
                        <div
                          key={idx}
                          title={p.name}
                          className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white"
                        >
                          {p.name.charAt(0)}
                        </div>
                      ))}
                      {Array.from({ length: tour.maxPlayers - tour.players.length }).map((_, i) => (
                        <div
                          key={`empty_${i}`}
                          className="w-6 h-6 rounded-full bg-black/40 border-2 border-slate-800 flex items-center justify-center text-[10px] text-gray-600"
                        >
                          +
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    {isRunning ? (
                      <button
                        onClick={() => onEnterTable && onEnterTable(`table_${tour.id}`)}
                        className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-1.5"
                      >
                        <span>👁</span>
                        <span>Смотреть турнир</span>
                      </button>
                    ) : isRegistered ? (
                      <div className="flex w-full gap-2">
                        <button
                          onClick={() => onLeave(tour.id)}
                          className="flex-1 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/40 text-red-300 font-bold text-xs border border-red-500/30 transition"
                        >
                          Отменить регистрацию
                        </button>
                        <button
                          onClick={() => onFillBots(tour.id)}
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center gap-1"
                          title="Заполнить оставшиеся места ботами для мгновенного старта"
                        >
                          <span>🤖</span>
                          <span>Старт с ботами</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex w-full gap-2">
                        <button
                          onClick={() => onJoin(tour.id)}
                          disabled={isFull}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transform active:scale-95 transition"
                        >
                          Зарегистрироваться (${tour.buyIn.toLocaleString()})
                        </button>
                        <button
                          onClick={() => {
                            onJoin(tour.id);
                            setTimeout(() => onFillBots(tour.id), 200);
                          }}
                          className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                          title="Вступить и сразу наполнить ботами"
                        >
                          🤖 Быстрый старт
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
