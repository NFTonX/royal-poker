import React, { useState } from 'react';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'combinations' | 'rules'>('combinations');

  const combinations = [
    { name: 'Роял Флеш', cards: 'A♠ K♠ Q♠ J♠ T♠', desc: 'Туз, Король, Дама, Валет и Десятка одной масти. Самая сильная рука!' },
    { name: 'Стрит Флеш', cards: '9♥ 8♥ 7♥ 6♥ 5♥', desc: 'Пять карт одной масти по порядку.' },
    { name: 'Каре (Четверка)', cards: 'K♦ K♣ K♥ K♠ 4♦', desc: 'Четыре карты одного ранга.' },
    { name: 'Фулл Хаус', cards: 'Q♠ Q♦ Q♥ 8♣ 8♦', desc: 'Три карты одного ранга и две другого (Сет + Пара).' },
    { name: 'Флеш', cards: 'A♣ J♣ 9♣ 6♣ 2♣', desc: 'Любые пять карт одной масти.' },
    { name: 'Стрит', cards: '8♦ 7♠ 6♣ 5♥ 4♦', desc: 'Пять карт подряд любой масти.' },
    { name: 'Тройка (Сет)', cards: 'J♥ J♦ J♠ 9♣ 4♦', desc: 'Три карты одного ранга.' },
    { name: 'Две Пары', cards: 'T♠ T♦ 6♥ 6♣ A♦', desc: 'Две различные пары карт.' },
    { name: 'Одна Пара', cards: '9♠ 9♥ A♦ K♣ 4♠', desc: 'Две карты одного ранга.' },
    { name: 'Старшая Карта', cards: 'A♠ K♦ 9♥ 7♣ 3♦', desc: 'Когда нет других комбинаций, старшая карта определяет силу.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎓</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Обучение и Правила</h2>
              <p className="text-xs text-blue-400/80">Гайд по Техасскому Холдему</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 p-2 gap-2">
          <button
            onClick={() => setTab('combinations')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'combinations'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🃏</span>
            <span>Комбинации (10)</span>
          </button>
          <button
            onClick={() => setTab('rules')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'rules'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>📜</span>
            <span>Правила игры</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {tab === 'combinations' ? (
            combinations.map((c, idx) => (
              <div
                key={c.name}
                className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-extrabold text-white">{c.name}</h4>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">{c.desc}</p>
                </div>

                <div className="bg-black/60 px-2 py-1 rounded border border-white/10 text-xs font-mono font-bold text-amber-300 shrink-0">
                  {c.cards}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
                <h4 className="font-bold text-white text-sm mb-1 text-blue-400">1. Цель игры</h4>
                <p>
                  Собрать наилучшую покерную комбинацию из 5 карт, используя свои 2 закрытые карты и 5 общих карт на столе, либо заставить всех остальных игроков сбросить карты.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
                <h4 className="font-bold text-white text-sm mb-1 text-emerald-400">2. Раунды торговли</h4>
                <ul className="space-y-1.5 list-disc pl-4 text-gray-300">
                  <li><strong className="text-white">Префлоп:</strong> игрокам раздаются по 2 карты в закрытую. Ставятся малый и большой блайнды. Первый круг ставок.</li>
                  <li><strong className="text-white">Флоп:</strong> на стол выкладываются 3 общие карты. Второй круг ставок.</li>
                  <li><strong className="text-white">Терн:</strong> выкладывается 4-я общая карта. Третий круг ставок.</li>
                  <li><strong className="text-white">Ривер:</strong> выкладывается 5-я общая карта. Финальный круг ставок.</li>
                  <li><strong className="text-white">Вскрытие (Шоудаун):</strong> оставшиеся игроки показывают карты, и банк достается сильнейшей комбинации.</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
                <h4 className="font-bold text-white text-sm mb-1 text-amber-400">3. Доступные действия</h4>
                <p>
                  <strong>Чек (Check):</strong> передать ход без ставки, если никто не повышал.<br />
                  <strong>Колл (Call):</strong> уравнять текущую ставку.<br />
                  <strong>Бет / Рейз (Bet / Raise):</strong> сделать или увеличить ставку.<br />
                  <strong>Фолд (Fold):</strong> сбросить карты и выйти из раздачи.<br />
                  <strong>Ва-банк (All-In):</strong> поставить все свои оставшиеся фишки.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
