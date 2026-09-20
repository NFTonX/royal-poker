import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import localtunnel from 'localtunnel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const BOT_TOKEN = '8712635587:AAFBtXLcKnrSCkwGBSPTXTnDr2ANz510XPE';
const BOT_USERNAME = 'RoyalsPokerBot';

async function updateBotMenuButton(appUrl) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: '♠️ Играть в Покер',
          web_app: { url: appUrl }
        }
      })
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`[Bot] ✅ Chat Menu Button successfully set to: ${appUrl}`);
    } else {
      console.error(`[Bot] ❌ Failed to set menu button:`, data);
    }
  } catch (err) {
    console.error(`[Bot] Error updating menu button:`, err);
  }
}

async function startTunnel() {
  const cloudflaredPath = path.join(__dirname, 'cloudflared.exe');

  if (fs.existsSync(cloudflaredPath)) {
    console.log('[Tunnel] Starting Cloudflare Tunnel (no passwords, fast HTTPS)...');
    return new Promise((resolve) => {
      const cf = spawn(cloudflaredPath, ['tunnel', '--url', `http://localhost:${PORT}`]);
      
      let resolved = false;
      const handleData = (chunk) => {
        const text = chunk.toString();
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && !resolved) {
          resolved = true;
          resolve({ url: match[0], process: cf });
        }
      };

      cf.stdout.on('data', handleData);
      cf.stderr.on('data', handleData);

      cf.on('error', (err) => {
        console.error('[Tunnel] Cloudflared error, falling back to localtunnel:', err);
        if (!resolved) {
          resolved = true;
          startLocaltunnel().then(resolve);
        }
      });

      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          startLocaltunnel().then(resolve);
        }
      }, 15000);
    });
  } else {
    return startLocaltunnel();
  }
}

async function startLocaltunnel() {
  console.log('[Tunnel] Starting Localtunnel...');
  const tunnel = await localtunnel({ port: PORT });
  return { url: tunnel.url, tunnel };
}

const logFile = path.join(__dirname, 'server.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const origLog = console.log;
const origErr = console.error;

console.log = (...args) => {
  const msg = `[${new Date().toISOString()}] ` + args.join(' ') + '\n';
  try { logStream.write(msg); } catch (_) {}
  try { origLog(...args); } catch (_) {}
};

console.error = (...args) => {
  const msg = `[${new Date().toISOString()}] [ERROR] ` + args.join(' ') + '\n';
  try { logStream.write(msg); } catch (_) {}
  try { origErr(...args); } catch (_) {}
};

async function main() {
  console.log('====================================================');
  console.log('♠️ Starting Royal Poker Club Server & Telegram Bot...');
  console.log('====================================================');

  // Start backend server
  const serverProcess = spawn('node', ['backend/dist/server.js'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: PORT.toString(),
      BOT_TOKEN,
      BOT_USERNAME
    }
  });

  serverProcess.stdout.on('data', (data) => {
    try { logStream.write(data); } catch (_) {}
    try { process.stdout.write(data); } catch (_) {}
  });

  serverProcess.stderr.on('data', (data) => {
    try { logStream.write(data); } catch (_) {}
    try { process.stderr.write(data); } catch (_) {}
  });

  // Wait 2 seconds for server to bind port
  await new Promise(r => setTimeout(r, 2000));

  // Start tunnel
  const { url: publicUrl } = await startTunnel();

  console.log('\n====================================================');
  console.log(`🌐 Public HTTPS URL: ${publicUrl}`);
  console.log(`🤖 Telegram Bot: @${BOT_USERNAME}`);
  console.log('====================================================\n');

  // Update bot menu button
  await updateBotMenuButton(publicUrl);

  // Dynamically update server APP_URL
  try {
    await fetch(`http://localhost:${PORT}/api/set-app-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: publicUrl })
    });
  } catch (err) {
    console.warn('Failed to notify server of new APP_URL:', err);
  }

  // Update .env files with APP_URL
  const envContent = `PORT=${PORT}\nBOT_TOKEN=${BOT_TOKEN}\nBOT_USERNAME=${BOT_USERNAME}\nNODE_ENV=production\nAPP_URL=${publicUrl}\n`;
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  fs.writeFileSync(path.join(__dirname, 'backend', '.env'), envContent);

  console.log('🎉 Всё запущено и готово к игре!');
  console.log(`👉 Откройте Telegram бота: https://t.me/${BOT_USERNAME}`);
  console.log('Нажмите кнопку «♠️ Играть в Покер» в меню или введите /start.\n');

  process.on('SIGINT', () => {
    serverProcess.kill();
    process.exit();
  });

  process.on('SIGTERM', () => {
    serverProcess.kill();
    process.exit();
  });
}

main().catch(console.error);
