import { Bot, InlineKeyboard } from 'grammy';
import { db } from '../db/database.js';
import { StarsPackage, WithdrawalRequest } from '../types/poker.js';

export const ADMIN_ID = process.env.ADMIN_ID || '6968710985';
export const CLUB_TON_WALLET = process.env.TON_WALLET_ADDRESS || 'UQBxVtuIc5jNmjJqMohUm9DpgJaOozq1OalNaGP5KfruUW1y';

export const STARS_PACKAGES: Record<string, StarsPackage> = {
  stars_10: {
    id: 'stars_10',
    stars: 10,
    chips: 2000,
    title: '2,000 Фишек',
    badge: '👑 VIP Bronze'
  },
  stars_50: {
    id: 'stars_50',
    stars: 50,
    chips: 12000,
    title: '12,000 Фишек',
    badge: '👑 VIP Silver'
  },
  stars_100: {
    id: 'stars_100',
    stars: 100,
    chips: 30000,
    title: '30,000 Фишек',
    badge: '👑 VIP Gold'
  },
  stars_250: {
    id: 'stars_250',
    stars: 250,
    chips: 85000,
    title: '85,000 Фишек',
    badge: '👑 VIP Platinum'
  },
  stars_500: {
    id: 'stars_500',
    stars: 500,
    chips: 200000,
    title: '200,000 Фишек',
    badge: '👑 VIP Royal Diamond'
  }
};

export class TelegramPokerBot {
  public bot: Bot;
  private appUrl: string = '';
  private onPaymentSuccessCallback?: (userId: string, chips: number) => void;

  constructor(token: string) {
    this.bot = new Bot(token);
    this.setupHandlers();
  }

  public setAppUrl(url: string): void {
    this.appUrl = url;
    this.updateMenuButton();
  }

  public setOnPaymentSuccess(cb: (userId: string, chips: number) => void): void {
    this.onPaymentSuccessCallback = cb;
  }

  private async updateMenuButton(): Promise<void> {
    if (!this.appUrl) return;
    try {
      await this.bot.api.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: '♠️ Играть',
          web_app: { url: this.appUrl }
        }
      });
      console.log(`[Bot] Menu button updated to: ${this.appUrl}`);
    } catch (err) {
      console.error('[Bot] Failed to set menu button:', err);
    }
  }

  private setupHandlers(): void {
    // /start command
    this.bot.command('start', async (ctx) => {
      const user = ctx.from;
      if (!user) return;

      db.getOrCreateUser(user.id.toString(), user.first_name, user.username);

      let referralNotice = '';
      const match = ctx.match;
      if (match && typeof match === 'string' && match.startsWith('ref_')) {
        const referrerId = match.replace('ref_', '').trim();
        const refResult = db.processReferral(user.id.toString(), referrerId);
        if (refResult.success) {
          referralNotice = `\n\n🎁 <b>Вы перешли по ссылке друга!</b> Вам начислен бонус <b>+1,000 фишек</b>!`;
          try {
            await this.bot.api.sendMessage(
              parseInt(referrerId, 10),
              `🎉 <b>Новый реферал!</b>\n\n` +
              `Игрок <b>${user.first_name}</b> присоединился по вашей ссылке!\n` +
              `💰 Вам начислено <b>+2,500 фишек</b>!`,
              { parse_mode: 'HTML' }
            );
          } catch (e) {
            // Ignore if cannot message
          }
        }
      }

      const botUsername = ctx.me?.username || 'RoyalsPokerBot';
      const refLink = `https://t.me/${botUsername}?start=ref_${user.id}`;

      const currentUrl = this.appUrl || process.env.APP_URL || '';

      const keyboard = new InlineKeyboard();
      if (currentUrl) {
        keyboard.webApp('♠️ Играть в Покер', currentUrl).row();
        keyboard.url('🌐 Открыть в браузере', currentUrl).row();
      }
      keyboard.url(
        '👥 Пригласить друга (+2,500 💰)',
        `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Играй со мной в онлайн-покер в Telegram! Заходи и забирай 3,500 бесплатных фишек ♠️')}`
      ).row();
      keyboard.url('⭐️ Поддержка', 'https://t.me/BotFather');

      await ctx.reply(
        `👋 Привет, ${user.first_name}!\n\n` +
        `Добро пожаловать в <b>Royal Poker Club</b>! ♠️♥️♦️♣️\n\n` +
        `🏆 Играй в настоящий Техасский Холдем против других игроков и ботов!\n` +
        `🎁 Тебе начислено <b>2,500 бесплатных фишек</b> на первый вход.${referralNotice}\n` +
        `⭐️ Покупай фишки за Telegram Stars прямо в приложении.\n` +
        `👥 <b>Приглашай друзей</b> и получай <b>+2,500 фишек</b> за каждого!\n\n` +
        `Твоя реферальная ссылка:\n<code>${refLink}</code>\n\n` +
        `Нажми кнопку <b>«Играть в Покер»</b> ниже для старта!`,
        {
          parse_mode: 'HTML',
          reply_markup: keyboard
        }
      );
    });

    // Handle Pre-Checkout Query for Telegram Stars
    this.bot.on('pre_checkout_query', async (ctx) => {
      try {
        await ctx.answerPreCheckoutQuery(true);
      } catch (err) {
        console.error('[Bot] PreCheckout error:', err);
        await ctx.answerPreCheckoutQuery(false, {
          error_message: 'Не удалось обработать платеж. Попробуйте снова.'
        });
      }
    });

    // Handle Successful Payment
    this.bot.on(':successful_payment', async (ctx) => {
      try {
        const payment = ctx.message?.successful_payment;
        if (!payment) return;

        const payloadStr = payment.invoice_payload;
        let payload: { userId: string; packageId: string };
        try {
          payload = JSON.parse(payloadStr);
        } catch {
          console.error('[Bot] Invalid invoice payload:', payloadStr);
          return;
        }

        const pack = STARS_PACKAGES[payload.packageId];
        if (!pack) {
          console.error('[Bot] Unknown package:', payload.packageId);
          return;
        }

        const newBalance = db.recordPurchase(
          payload.userId,
          pack.stars,
          pack.chips,
          payment.telegram_payment_charge_id
        );

        await ctx.reply(
          `🎉 <b>Оплата прошла успешно!</b>\n\n` +
          `Вам начислено <b>+${pack.chips.toLocaleString()}</b> фишек за ⭐️ <b>${pack.stars} Stars</b>!\n` +
          `💰 Ваш текущий баланс: <b>${newBalance.toLocaleString()}</b> фишек.\n\n` +
          `Удачи за столами! ♠️`,
          { parse_mode: 'HTML' }
        );

        if (this.onPaymentSuccessCallback) {
          this.onPaymentSuccessCallback(payload.userId, pack.chips);
        }
      } catch (err) {
        console.error('[Bot] Successful payment handler error:', err);
      }
    });

    // Admin Command: /admin or /withdrawals
    this.bot.command(['admin', 'withdrawals'], async (ctx) => {
      if (ctx.from?.id.toString() !== ADMIN_ID) {
        await ctx.reply('У вас нет прав администратора.');
        return;
      }

      const pending = db.getPendingWithdrawals();
      if (pending.length === 0) {
        await ctx.reply('✅ Нет активных заявок на вывод TON.');
        return;
      }

      for (const req of pending) {
        const text = `🔔 <b>Заявка на вывод:</b>\n\n` +
          `🆔 <code>#${req.id}</code>\n` +
          `👤 <b>${req.firstName || 'Игрок'}</b> ${req.username ? '(@' + req.username + ')' : ''} [ID: <code>${req.userId}</code>]\n` +
          `💎 Сумма: <b>${req.amount} TON</b>\n` +
          `📍 Адрес: <code>${req.address}</code>\n` +
          `⏰ Создана: ${new Date(req.createdAt).toLocaleString('ru-RU')}`;

        const kb = new InlineKeyboard()
          .text('✅ Выплачено', `w_app_${req.id}`)
          .text('❌ Отклонить', `w_rej_${req.id}`);

        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
      }
    });

    // Admin approve withdrawal callback
    this.bot.callbackQuery(/^w_app_(.+)$/, async (ctx) => {
      if (ctx.from.id.toString() !== ADMIN_ID) {
        await ctx.answerCallbackQuery({ text: 'Доступ запрещен' });
        return;
      }
      const reqId = ctx.match[1];
      const req = db.approveWithdrawal(reqId);
      if (req) {
        await ctx.editMessageText(
          (ctx.callbackQuery.message?.text || '') + `\n\n✅ <b>ВЫПЛАЧЕНО администратором</b> (${new Date().toLocaleString('ru-RU')})`,
          { parse_mode: 'HTML' }
        );
        await ctx.answerCallbackQuery({ text: `Вывод #${reqId} подтвержден!` });
        try {
          await this.bot.api.sendMessage(
            parseInt(req.userId, 10),
            `✅ <b>Ваш вывод ${req.amount} TON успешно отправлен!</b>\n\n` +
            `📍 Адрес получения: <code>${req.address}</code>\n\n` +
            `Спасибо за игру в Royal Poker Club! ♠️`,
            { parse_mode: 'HTML' }
          );
        } catch (e) {
          // ignore
        }
      } else {
        await ctx.answerCallbackQuery({ text: 'Заявка уже обработана или не найдена' });
      }
    });

    // Admin reject withdrawal callback
    this.bot.callbackQuery(/^w_rej_(.+)$/, async (ctx) => {
      if (ctx.from.id.toString() !== ADMIN_ID) {
        await ctx.answerCallbackQuery({ text: 'Доступ запрещен' });
        return;
      }
      const reqId = ctx.match[1];
      const req = db.rejectWithdrawal(reqId);
      if (req) {
        await ctx.editMessageText(
          (ctx.callbackQuery.message?.text || '') + `\n\n❌ <b>ОТКЛОНЕНО</b>. Средства (${req.amount} TON) возвращены игроку.`,
          { parse_mode: 'HTML' }
        );
        await ctx.answerCallbackQuery({ text: `Вывод #${reqId} отклонен, баланс возвращен` });
        try {
          await this.bot.api.sendMessage(
            parseInt(req.userId, 10),
            `❌ <b>Ваша заявка на вывод ${req.amount} TON отклонена администратором.</b>\n\n` +
            `Средства (${req.amount} TON) возвращены на ваш игровой баланс.`,
            { parse_mode: 'HTML' }
          );
        } catch (e) {
          // ignore
        }
      } else {
        await ctx.answerCallbackQuery({ text: 'Заявка уже обработана или не найдена' });
      }
    });

    // Global error handler
    this.bot.catch((err) => {
      console.error('[Bot] Grammy error:', err.message || err);
    });
  }

  public async notifyAdminWithdrawal(req: WithdrawalRequest): Promise<void> {
    try {
      const text = `🔔 <b>Новая заявка на вывод TON!</b>\n\n` +
        `🆔 Заявка: <code>#${req.id}</code>\n` +
        `👤 Игрок: <b>${req.firstName || 'Игрок'}</b> ${req.username ? '(@' + req.username + ')' : ''} [ID: <code>${req.userId}</code>]\n` +
        `💎 Сумма: <b>${req.amount} TON</b>\n` +
        `📍 Адрес: <code>${req.address}</code>\n` +
        `⏰ Создана: ${new Date(req.createdAt).toLocaleString('ru-RU')}`;

      const kb = new InlineKeyboard()
        .text('✅ Выплачено', `w_app_${req.id}`)
        .text('❌ Отклонить', `w_rej_${req.id}`);

      await this.bot.api.sendMessage(parseInt(ADMIN_ID, 10), text, {
        parse_mode: 'HTML',
        reply_markup: kb
      });
    } catch (err) {
      console.error('[Bot] Failed to send admin withdrawal notification:', err);
    }
  }

  public async notifyAdminDeposit(userId: string, amount: number, boc?: string): Promise<void> {
    try {
      const user = db.getUser(userId);
      const text = `💰 <b>Новый депозит TON!</b>\n\n` +
        `👤 Игрок: <b>${user?.firstName || 'Игрок'}</b> ${user?.username ? '(@' + user.username + ')' : ''} [ID: <code>${userId}</code>]\n` +
        `💎 Сумма: <b>+${amount} TON</b>\n` +
        `🏦 Кошелёк клуба: <code>${CLUB_TON_WALLET}</code>\n` +
        (boc ? `📦 BOC: <code>${boc.slice(0, 32)}...</code>\n` : '') +
        `⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

      await this.bot.api.sendMessage(parseInt(ADMIN_ID, 10), text, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[Bot] Failed to send admin deposit notification:', err);
    }
  }

  public async createStarsInvoiceLink(userId: string, packageId: string): Promise<string> {
    const pack = STARS_PACKAGES[packageId];
    if (!pack) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }

    const payload = JSON.stringify({
      userId,
      packageId,
      timestamp: Date.now()
    });

    const link = await this.bot.api.createInvoiceLink(
      pack.title,
      `Покупка ${pack.chips.toLocaleString()} фишек в Royal Poker Club за ${pack.stars} Telegram Stars`,
      payload,
      '', // Provider token is empty for Telegram Stars (XTR)
      'XTR', // Official Telegram Stars currency code
      [{ amount: pack.stars, label: `${pack.chips.toLocaleString()} фишек` }]
    );

    return link;
  }

  public async start(): Promise<void> {
    try {
      await this.bot.api.deleteWebhook({ drop_pending_updates: true });
    } catch (e) {
      // ignore
    }

    const runBot = () => {
      this.bot.start({
        drop_pending_updates: true,
        onStart: (botInfo) => {
          console.log(`[Bot] Successfully started as @${botInfo.username}`);
        }
      }).catch(async (err: any) => {
        console.error('[Bot] Polling start error:', err.message || err);
        if (String(err).includes('409') || String(err?.message).includes('409')) {
          console.log('[Bot] 409 Conflict, retrying polling in 3 seconds...');
          setTimeout(runBot, 3000);
        }
      });
    };

    runBot();
  }

  public stop(): void {
    this.bot.stop();
  }
}
