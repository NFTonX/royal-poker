import React, { useState } from 'react';
import { StarsPackage, User } from '../types';
import { getTelegramWebApp, haptic } from '../utils/telegram';
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Star, Sparkles, ShieldCheck, Gift, Loader2, Info, Gem, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

interface WalletViewProps {
  user: User | null;
  onClaimDailyBonus: () => void;
  onSuccessPurchase?: () => void;
  onDepositTon?: (amount: number, boc?: string) => void;
  onWithdrawTon?: (amount: number, address: string) => void;
}

const STARS_PACKAGES: StarsPackage[] = [
  {
    id: 'stars_10',
    stars: 10,
    chips: 2000,
    title: '2,000 Фишек',
    badge: '👑 VIP Bronze'
  },
  {
    id: 'stars_50',
    stars: 50,
    chips: 12000,
    title: '12,000 Фишек',
    badge: '👑 VIP Silver'
  },
  {
    id: 'stars_100',
    stars: 100,
    chips: 30000,
    title: '30,000 Фишек',
    badge: '👑 VIP Gold'
  },
  {
    id: 'stars_250',
    stars: 250,
    chips: 85000,
    title: '85,000 Фишек',
    badge: '👑 VIP Platinum'
  },
  {
    id: 'stars_500',
    stars: 500,
    chips: 200000,
    title: '200,000 Фишек',
    badge: '👑 VIP Royal Diamond'
  }
];

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  onClaimDailyBonus,
  onSuccessPurchase,
  onDepositTon,
  onWithdrawTon
}) => {
  const [activeTab, setActiveTab] = useState<'stars' | 'ton'>('stars');
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // TON State
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [depositAmount, setDepositAmount] = useState<string>('2');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('2');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [isProcessingTon, setIsProcessingTon] = useState<boolean>(false);

  const handleBuy = async (pack: StarsPackage) => {
    if (!user || loadingPackId !== null) return;
    haptic.medium();
    setLoadingPackId(pack.id);
    setErrorMsg(null);
    setSuccessMsg(null);

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
            setSuccessMsg('Оплата прошла успешно! Фишки зачислены.');
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

  const CLUB_TON_WALLET = 'UQBxVtuIc5jNmjJqMohUm9DpgJaOozq1OalNaGP5KfruUW1y';

  const handleTonDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Введите корректную сумму TON (минимум 0.5 TON)');
      return;
    }

    if (!wallet) {
      tonConnectUI.openModal();
      setErrorMsg('Пожалуйста, сначала подключите ваш TON-кошелек');
      return;
    }

    haptic.medium();
    setIsProcessingTon(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Real transaction through TON Connect to Club Wallet
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: CLUB_TON_WALLET,
            amount: Math.round(amt * 1e9).toString() // in nanoTON
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      // ONLY credit when transaction has been confirmed and BOC returned
      if (result && result.boc) {
        if (onDepositTon) onDepositTon(amt, result.boc);
        setSuccessMsg(`Транзакция отправлена в блокчейн! Баланс пополнен на +${amt} TON.`);
        haptic.success();
      } else {
        setErrorMsg('Транзакция не была подтверждена в кошельке');
        haptic.error();
      }
    } catch (err: any) {
      console.error('TON deposit error:', err);
      // NO FAKE FALLBACK! User canceled or failed transaction
      setErrorMsg(err?.message && !err.message.includes('reject') ? `Ошибка: ${err.message}` : 'Транзакция отменена в кошельке. Баланс не изменен.');
      haptic.error();
    } finally {
      setIsProcessingTon(false);
    }
  };

  const handleTonWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 0.5) {
      setErrorMsg('Минимальная сумма для вывода: 0.5 TON');
      return;
    }
    if ((user?.tonBalance || 0) < amt) {
      setErrorMsg(`Недостаточно TON на игровом балансе (у вас ${(user?.tonBalance || 0).toFixed(2)} TON)`);
      return;
    }
    const targetAddress = withdrawAddress.trim() || (wallet ? wallet.account.address : '');
    if (!targetAddress) {
      setErrorMsg('Укажите адрес вашего кошелька TON или подключите кошелек');
      return;
    }

    haptic.medium();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (onWithdrawTon) {
      onWithdrawTon(amt, targetAddress);
      setSuccessMsg(`Заявка на вывод ${amt} TON создана и отправлена администратору! Средства будут переведены после подтверждения.`);
      haptic.success();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-28 animate-fadeIn select-none">
      
      {/* Wallet Navigation Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-white/[0.06]">
        <button
          onClick={() => {
            haptic.light();
            setActiveTab('stars');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'stars'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Telegram Stars & Фишки</span>
        </button>

        <button
          onClick={() => {
            haptic.light();
            setActiveTab('ton');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'ton'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gem className="w-3.5 h-3.5" />
          <span>Криптовалюта TON</span>
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs text-center animate-fadeIn">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs text-center flex items-center justify-center gap-1.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: TELEGRAM STARS */}
      {activeTab === 'stars' && (
        <>
          {/* Hero Card */}
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

            {/* Free Daily Bonus */}
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

          {/* Stars Store Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <span>Пакеты Telegram Stars & VIP</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <span className="text-[11px] text-slate-500">Открывают VIP-столы</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STARS_PACKAGES.map((pack) => {
                const isLoading = loadingPackId === pack.id;

                return (
                  <div
                    key={pack.id}
                    className="glass-card rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 relative overflow-hidden border-amber-500/20 hover:border-amber-500/40"
                  >
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
        </>
      )}

      {/* TAB 2: TON CRYPTO */}
      {activeTab === 'ton' && (
        <>
          {/* TON Hero Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#051329] via-[#081e3d] to-[#020b17] border border-cyan-500/40 p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-300/80">
                  Баланс Криптовалюты TON
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-mono text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                    {user?.tonBalance !== undefined ? user.tonBalance.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-xs text-cyan-400 font-bold">TON</span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                <Gem className="w-6 h-6 text-cyan-400" />
              </div>
            </div>

            {/* TON Connect Wallet Button */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-slate-300 font-semibold">
                  {wallet ? 'Кошелек подключен:' : 'Подключите кошелек:'}
                </span>
                {wallet && (
                  <span className="text-[10px] font-mono text-cyan-400">
                    {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
                  </span>
                )}
              </div>
              <div className="ton-connect-wrapper">
                <TonConnectButton />
              </div>
            </div>
          </div>

          {/* TON Deposit & Withdraw Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Deposit Box */}
            <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <ArrowDownLeft className="w-4 h-4" />
                <span>Пополнить TON</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Минимальный бай-ин за TON-столами от 2 TON.
              </p>

              <div className="flex items-center gap-1.5">
                {[2, 5, 10, 25].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      haptic.light();
                      setDepositAmount(val.toString());
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                      depositAmount === val.toString()
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {val} TON
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="0.5"
                step="0.5"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Сумма в TON"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
              />

              <button
                onClick={handleTonDeposit}
                disabled={isProcessingTon}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-md border border-cyan-400/40 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isProcessingTon ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Оплатить {depositAmount} TON через кошелек</span>}
              </button>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.06] flex flex-col gap-1 text-[10px] text-slate-400">
                <span className="font-semibold text-cyan-300">Прямой перевод на кошелек клуба:</span>
                <span className="font-mono text-white select-all break-all">{CLUB_TON_WALLET}</span>
                <span className="text-slate-500">Комментарий к переводу: <code className="text-cyan-400">deposit_{user?.id || 'id'}</code></span>
              </div>
            </div>

            {/* Withdraw Box */}
            <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>Вывести TON</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Заявка на вывод отправляется администратору. Средства поступают на кошелек после подтверждения.
              </p>

              <input
                type="number"
                min="0.5"
                step="0.5"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Сумма в TON"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-blue-400"
              />

              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Адрес кошелька (UQ... или EQ...)"
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-blue-400"
                />
                {wallet && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      setWithdrawAddress(wallet.account.address);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 text-left font-semibold underline decoration-dashed"
                  >
                    Вставить мой подключенный кошелек
                  </button>
                )}
              </div>

              <button
                onClick={handleTonWithdraw}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md border border-blue-400/40 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <span>Отправить заявку на вывод {withdrawAmount} TON</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Transparency Box */}
      <div className="glass-card rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-400 border border-slate-800">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 leading-relaxed text-[11px]">
          <span className="text-slate-300 font-semibold">Безопасность и регламент:</span>
          <span>
            {activeTab === 'stars'
              ? 'Фишки являются внутриигровой валютой для тренировочных и VIP-столов. Покупки через Telegram Stars официальны и защищены Telegram.'
              : 'Криптовалютные столы работают напрямую через блокчейн TON. Депозиты и выводы обрабатываются смарт-контрактами и некастодиальными кошельками.'}
          </span>
        </div>
      </div>

      {/* Security Footer */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Защищено шифрованием Telegram & TON Network</span>
      </div>
    </div>
  );
};
