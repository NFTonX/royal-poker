import React, { useState } from 'react';
import { StarsPackage } from '../types';
import { getTelegramWebApp, haptic } from '../utils/telegram';
import { X, Star, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccessPurchase?: () => void;
}

const STARS_PACKAGES: StarsPackage[] = [
  {
    id: 'stars_50',
    stars: 50,
    chips: 5000,
    title: '5,000 Фишек',
    badge: 'Старт'
  },
  {
    id: 'stars_150',
    stars: 150,
    chips: 20000,
    title: '20,000 Фишек',
    badge: 'Хит'
  },
  {
    id: 'stars_500',
    stars: 500,
    chips: 75000,
    title: '75,000 Фишек',
    badge: '+25% Бонус'
  },
  {
    id: 'stars_1000',
    stars: 1000,
    chips: 200000,
    title: '200,000 Фишек',
    badge: 'VIP Пакет'
  }
];

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSuccessPurchase
}) => {
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuy = async (pack: StarsPackage) => {
    haptic.medium();
    setLoadingPackId(pack.id);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          packageId: pack.id
        })
      });

      const data = await res.json();
      if (!res.ok || !data.invoiceLink) {
        throw new Error(data.error || 'Не удалось создать счет на оплату');
      }

      const tg = getTelegramWebApp();
      if (tg?.openInvoice) {
        tg.openInvoice(data.invoiceLink, (status) => {
          if (status === 'paid') {
            haptic.success();
            if (onSuccessPurchase) onSuccessPurchase();
            onClose();
          } else if (status === 'failed') {
            haptic.error();
            setErrorMsg('Оплата не прошла или была отклонена');
          }
        });
      } else {
        // Fallback for desktop/browser preview: open invoice URL in new window
        window.open(data.invoiceLink, '_blank');
      }
    } catch (err: any) {
      console.error('Invoice error:', err);
      setErrorMsg(err.message || 'Ошибка при создании счета');
      haptic.error();
    } finally {
      setLoadingPackId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-amber-500/30 p-5 shadow-2xl shadow-amber-950/30 flex flex-col gap-4">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 active:scale-95 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5 mt-1">
            Магазин Фишек
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h3>
          <p className="text-xs text-slate-400">
            Оплата официальной валютой Telegram Stars (XTR)
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Packages List */}
        <div className="flex flex-col gap-2.5">
          {STARS_PACKAGES.map((pack) => {
            const isLoading = loadingPackId === pack.id;
            return (
              <div
                key={pack.id}
                className="relative rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 p-3 flex items-center justify-between transition-all duration-200 group"
              >
                {/* Left Side: Chips Info */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-100 font-mono">
                      +{pack.chips.toLocaleString()}
                    </span>
                    {pack.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {pack.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">фишек на баланс</span>
                </div>

                {/* Right Side: Buy Button */}
                <button
                  onClick={() => handleBuy(pack)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>{pack.stars} Stars</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Безопасная оплата через Telegram Stars</span>
        </div>

      </div>
    </div>
  );
};
