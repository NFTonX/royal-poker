import React, { useState } from 'react';
import { CosmeticItem } from '../types';

interface CosmeticsModalProps {
  cosmetics: {
    items: CosmeticItem[];
    inventory: string[];
    equipped: {
      cardBack?: string;
      avatarFrame?: string;
      tableTheme?: string;
      chipStyle?: string;
    };
  } | null;
  userChips: number;
  onBuy: (itemId: string) => void;
  onEquip: (category: 'cardBack' | 'avatarFrame' | 'tableTheme' | 'chipStyle', itemId: string) => void;
  onClose: () => void;
}

type CategoryType = 'cardBack' | 'avatarFrame' | 'tableTheme';

export const CosmeticsModal: React.FC<CosmeticsModalProps> = ({
  cosmetics,
  userChips,
  onBuy,
  onEquip,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('cardBack');
  const [activeTab, setActiveTab] = useState<'shop' | 'wardrobe'>('shop');

  if (!cosmetics) return null;

  const categories: { key: CategoryType; label: string; icon: string }[] = [
    { key: 'cardBack', label: 'Рубашки карт', icon: '🎴' },
    { key: 'avatarFrame', label: 'Рамки', icon: '🖼' },
    { key: 'tableTheme', label: 'Сукно стола', icon: '🟢' }
  ];

  const filteredItems = cosmetics.items.filter(item => {
    if (item.category !== selectedCategory) return false;
    if (activeTab === 'wardrobe') return item.owned;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✨</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Гардероб & Магазин</h2>
              <p className="text-xs text-amber-400/80">Кастомизация карт, рамок и столов</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switch: Shop vs Wardrobe */}
        <div className="flex border-b border-white/10 bg-black/20 p-2 gap-2">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'shop'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Магазин предметов
          </button>
          <button
            onClick={() => setActiveTab('wardrobe')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'wardrobe'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Мой инвентарь ({cosmetics.inventory.length})
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 p-2.5 overflow-x-auto bg-black/10 border-b border-white/5">
          {categories.map(c => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedCategory === c.key
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-2 gap-3 flex-1">
          {filteredItems.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-gray-400 text-sm">
              В этой категории пока ничего нет
            </div>
          ) : (
            filteredItems.map(item => {
              const isEquipped = cosmetics.equipped[item.category] === item.id;
              const isOwned = item.owned;
              const canAfford = userChips >= item.priceChips;

              // Rarity border color
              const rarityColor = {
                common: 'border-gray-500/40 text-gray-400',
                rare: 'border-blue-500/40 text-blue-400',
                epic: 'border-purple-500/40 text-purple-400',
                legendary: 'border-amber-500/50 text-amber-400'
              }[item.rarity];

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                    isEquipped
                      ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500 shadow-md shadow-amber-500/20'
                      : isOwned
                      ? 'bg-slate-900/80 border-white/10'
                      : 'bg-black/40 border-white/5'
                  }`}
                >
                  <div>
                    {/* Preview box */}
                    <div className="w-full aspect-[4/3] rounded-lg bg-black/60 border border-white/10 flex items-center justify-center relative overflow-hidden mb-2">
                      {item.category === 'cardBack' && (
                        <div className={`w-12 h-16 rounded-md shadow-md flex items-center justify-center border-2 ${
                          item.id === 'card_sapphire' ? 'bg-gradient-to-br from-blue-700 to-indigo-900 border-blue-400' :
                          item.id === 'card_ruby' ? 'bg-gradient-to-br from-red-700 to-rose-950 border-rose-400' :
                          item.id === 'card_gold' ? 'bg-gradient-to-br from-amber-400 to-yellow-600 border-yellow-200' :
                          item.id === 'card_cyber' ? 'bg-gradient-to-br from-cyan-500 to-fuchsia-600 border-cyan-300' :
                          'bg-gradient-to-br from-slate-900 to-black border-slate-700'
                        }`}>
                          <span className="text-sm">♠️</span>
                        </div>
                      )}

                      {item.category === 'avatarFrame' && (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${
                          item.id === 'frame_bronze' ? 'border-amber-700 bg-amber-950/40' :
                          item.id === 'frame_silver' ? 'border-slate-300 bg-slate-800' :
                          item.id === 'frame_gold' ? 'border-amber-400 shadow-md shadow-amber-500/40 bg-amber-950/40' :
                          item.id === 'frame_neon' ? 'border-cyan-400 shadow-md shadow-cyan-500/50 bg-cyan-950/40' :
                          'border-rose-500 shadow-md shadow-rose-500/50 bg-rose-950/40'
                        }`}>
                          <span className="text-lg">👤</span>
                        </div>
                      )}

                      {item.category === 'tableTheme' && (
                        <div className={`w-20 h-12 rounded-2xl border-2 border-amber-900/60 flex items-center justify-center ${
                          item.id === 'table_emerald' ? 'bg-emerald-800' :
                          item.id === 'table_midnight' ? 'bg-blue-950' :
                          item.id === 'table_crimson' ? 'bg-rose-950' :
                          'bg-slate-900'
                        }`}>
                          <span className="text-[10px] text-white/50 font-bold">FEEL</span>
                        </div>
                      )}

                      <span className={`absolute top-1 right-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 border ${rarityColor}`}>
                        {item.rarity}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  </div>

                  {/* Actions */}
                  <div className="mt-2 pt-2 border-t border-white/5">
                    {isEquipped ? (
                      <div className="text-center text-[11px] font-black text-amber-400 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        ✓ Надето
                      </div>
                    ) : isOwned ? (
                      <button
                        onClick={() => onEquip(item.category, item.id)}
                        className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                      >
                        Надеть
                      </button>
                    ) : (
                      <button
                        onClick={() => onBuy(item.id)}
                        disabled={!canAfford}
                        className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 text-black font-extrabold text-xs shadow transition"
                      >
                        ${item.priceChips.toLocaleString()}
                      </button>
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
