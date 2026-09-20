import React, { useState } from 'react';
import { StarsPackage, User } from '../types';
import { getTelegramWebApp, haptic } from '../utils/telegram';
import { ChipStack } from './ChipStack';
import { Star, Sparkles, ShieldCheck, Gift, Loader2, Info } from 'lucide-react';

interface WalletViewProps {
  user: User | null;
  onClaimDailyBonus: () => void;
  onSuccessPurchase?: () => void;
}

const STARS_PACKAGES: StarsPackage[] = [
  {
    id: 'stars_50',
    stars: 50,
    chips: 5000,
    title: '5,000 Фишек',
    badge: 'Новичок'
  },
  {
    id: 'stars_150',
    stars: 150,
    chips: 20000,
    title: '20,000 Фишек',
    badge: 'Хит продаж'
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

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  onClaimDailyBonus,
  onSuccessPurchase
}) => {
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBuy = async (pack: StarsPackage) => {
    if (!user || loadingPackId !== null) return;
    haptic.medium();
    setLoadingPackId(pack.id);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
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
          } else if (status === 'failed') {
            haptic.error();
            setErrorMsg('Оплата была отклонена или не удалась');
          }
        });
      } else {
        window.open(data.invoiceLink, '_blank');
      }
    } catch (err: any) {
      console.error('Invoice error:', err);
      setErrorMsg(err.message || 'Ошибка при оформлении счета');
      haptic.error();
    } finally {
      setLoadingPackId(null);
    }
  };

  const handleClaim = () => {
    if (isClaiming) return;
    setIsClaiming(true);
    haptic.medium();
    onClaimDailyBonus();
    setTimeout(() => setIsClaiming(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-28 animate-fadeIn select-none">
      {/* Wallet Balance Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-[#0c101c] border border-amber-500/30 p-5 shadow-2xl relative overflow-hidden flex flex-col gap-3">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Баланс Игровых Фишек
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-amber-300 drop-shadow">
                ${user?.chips?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-amber-500 font-bold">chips</span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>
        </div>

        {/* Free Daily Bonus Button inside Wallet */}
        <div className="pt-2 border-t border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>Ежедневный подарок: <b>+1,000</b></span>
          </div>
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
          >
            {isClaiming ? 'Запрос...' : 'Забрать'}
          </button>
        </div>
      </div>

      {/* Error Notice if any */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs text-center">
          {errorMsg}
        </div>
      )}

      {/* Telegram Stars Store Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <span>Пакеты Telegram Stars</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </h3>
          <span className="text-[11px] text-slate-500">Официальная валюта Telegram</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {STARS_PACKAGES.map((pack) => {
            const isLoading = loadingPackId === pack.id;
            const isHot = pack.badge === 'Хит продаж' || pack.badge === '+25% Бонус';

            return (
              <div
                key={pack.id}
                className={`glass-card rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 relative overflow-hidden ${
                  isHot ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : ''
                }`}
              >
                {/* Badge if present */}
                {pack.badge && (
                  <div className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-300 border border-amber-400/40">
                    {pack.badge}
                  </div>
                )}

                <div className="flex flex-col">
                  <span className="text-lg font-black font-mono text-slate-100">
                    +{pack.chips.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">игровых фишек на баланс</span>
                </div>

                <button
                  onClick={() => handleBuy(pack)}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-xs shadow-md border border-amber-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                      <span>{pack.stars} Stars</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transparency & Disclaimer Box */}
      <div className="glass-card rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-400 border border-slate-800">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 leading-relaxed text-[11px]">
          <span className="text-slate-300 font-semibold">Информация об игровой валюте:</span>
          <span>
            Фишки являются исключительно внутриигровой валютой для развлечения. Фишки не имеют реальной денежной стоимости, не подлежат обмену на реальные деньги и не выводятся из приложения.
          </span>
        </div>
      </div>

      {/* Security Footer */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Официальные безопасные платежи Telegram</span>
      </div>
    </div>
  );
};
