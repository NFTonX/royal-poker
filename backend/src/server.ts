import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db/database.js';
import { TelegramPokerBot, STARS_PACKAGES } from './bot/telegram.js';
import { TableManager } from './socket/pokerSocket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const APP_URL = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || '';

if (!BOT_TOKEN) {
  console.error('FATAL: BOT_TOKEN is not defined in .env');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Enable Telegram WebApp framing
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org https://t.me");
  next();
});

// Initialize Telegram Bot & Poker Table Manager
const bot = new TelegramPokerBot(BOT_TOKEN);
const tableManager = new TableManager(io, bot);

if (APP_URL) {
  bot.setAppUrl(APP_URL);
}

// Dynamic APP_URL updater
app.post('/api/set-app-url', (req, res) => {
  const { url } = req.body;
  if (url) {
    bot.setAppUrl(url);
    console.log(`[Server] Dynamic APP_URL updated to: ${url}`);
  }
  res.json({ ok: true, appUrl: url });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/stars-packages', (req, res) => {
  res.json(Object.values(STARS_PACKAGES));
});

app.post('/api/create-invoice', async (req, res) => {
  try {
    const { userId, packageId } = req.body;
    if (!userId || !packageId) {
      return res.status(400).json({ error: 'Missing userId or packageId' });
    }

    const invoiceLink = await bot.createStarsInvoiceLink(userId.toString(), packageId);
    res.json({ invoiceLink });
  } catch (err: any) {
    console.error('Failed to create invoice:', err);
    res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

app.get('/api/user/:id', (req, res) => {
  const user = db.getUser(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/claim-daily-bonus', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  const result = db.claimDailyBonus(userId.toString());
  res.json(result);
});

app.get('/api/leaderboard', (req, res) => {
  res.json(db.getLeaderboard(20));
});

app.get('/api/tables', (req, res) => {
  res.json(tableManager.getTableList());
});

// Serve frontend build if exists
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`[Static] Serving frontend from: ${frontendDist}`);
} else {
  console.log(`[Static] Frontend dist not found at ${frontendDist}. Running in API-only mode.`);
}

// Start bot and HTTP server
bot.start();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`♠️ Royal Poker Server running on port ${PORT}`);
  console.log(`🤖 Telegram Bot: @${process.env.BOT_USERNAME || 'RoyalsPokerBot'}`);
  if (APP_URL) {
    console.log(`🌐 WebApp URL: ${APP_URL}`);
  }
  console.log(`=========================================`);
});

export { bot, tableManager };
