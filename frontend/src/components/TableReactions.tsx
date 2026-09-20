import React from 'react';

interface TableReactionsProps {
  onSelectReaction: (emoji: string) => void;
  onClose: () => void;
  cooldownActive: boolean;
}

const REACTIONS = ['👏', '🔥', '😎', '😭', '🤯', '🍀', '🤑', '🐟', '🚀', '💤'];

export const TableReactions: React.FC<TableReactionsProps> = ({
  onSelectReaction,
  onClose,
  cooldownActive
}) => {
  return (
    <div className="absolute bottom-20 right-4 z-40 bg-black/90 backdrop-blur-md border border-white/20 p-2.5 rounded-2xl shadow-2xl animate-scaleUp">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 px-1">
        <span className="text-[11px] font-bold text-gray-300">Быстрые реакции</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            disabled={cooldownActive}
            onClick={() => {
              onSelectReaction(emoji);
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/20 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xl transition transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      {cooldownActive && (
        <div className="mt-1.5 text-center text-[10px] text-amber-400 font-medium">
          Подождите пару секунд...
        </div>
      )}
    </div>
  );
};
