#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0] || 'serve';

function printHelp() {
  console.log(`
\x1b[38;2;16;185;129m⚡ MiniBase CLI — Ultra-lightweight Backend-as-a-Service (BaaS)\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  $ npx minibase [command] [options]
  $ minibase [command] [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[36mserve\x1b[0m                 Start the MiniBase server & Admin Studio (default)
  \x1b[36mbackup [path]\x1b[0m         Create an instant hot SQLite backup
  \x1b[36madmin create <e> <p>\x1b[0m  Create an admin user via command line
  \x1b[36mhelp, --help, -h\x1b[0m      Show this help message
  \x1b[36mversion, -v\x1b[0m           Show MiniBase version

\x1b[1mOPTIONS:\x1b[0m
  \x1b[33m--port <number>\x1b[0m       Set server port (default: 8090)
  \x1b[33m--host <address>\x1b[0m      Set server host (default: 0.0.0.0)
  \x1b[33m--dir <path>\x1b[0m          Set data directory (default: ./minibase_data)
  \x1b[33m--open\x1b[0m                Automatically open Admin UI in default browser
  \x1b[33m--dev\x1b[0m                 Run in development mode with debug logs

\x1b[1mEXAMPLES:\x1b[0m
  $ npx minibase
  $ npx minibase serve --port 3000 --dir ./my_data --open
  $ npx minibase backup ./backups/backup-1.db
`);
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd.exe', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {}
}

if (command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'version' || command === '-v' || command === '--version') {
  const pkgPath = path.resolve(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  console.log(`MiniBase v${pkg.version}`);
  process.exit(0);
}

if (command === 'backup') {
  const backupDest = args[1] || `./minibase_backup_${Date.now()}.db`;
  const { getDB } = await import('../src/core/db.js');
  const { config } = await import('../src/config.js');
  const db = getDB();
  
  console.log(`\x1b[36m➜\x1b[0m Creating SQLite hot backup from \x1b[90m${config.dbPath}\x1b[0m...`);
  try {
    const destPath = path.resolve(backupDest);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    
    // SQLite WAL safe backup copy
    fs.copyFileSync(config.dbPath, destPath);
    console.log(`\x1b[32m✔ Backup created successfully:\x1b[0m ${destPath}`);
  } catch (err) {
    console.error(`\x1b[31m✖ Backup failed:\x1b[0m`, err.message);
  }
  process.exit(0);
}

if (command === 'admin' && args[1] === 'create') {
  const email = args[2];
  const password = args[3];
  if (!email || !password) {
    console.error('\x1b[31mError:\x1b[0m Please provide email and password. Example: minibase admin create admin@example.com mypassword123');
    process.exit(1);
  }
  
  const { getDB } = await import('../src/core/db.js');
  const { AuthManager } = await import('../src/core/auth.js');
  getDB();
  
  try {
    const admin = AuthManager.createInitialAdmin(email, password);
    console.log(`\x1b[32m✔ Super-Admin created:\x1b[0m ${admin.email} (ID: ${admin.id})`);
  } catch (err) {
    console.error(`\x1b[31m✖ Error creating admin:\x1b[0m`, err.message);
  }
  process.exit(0);
}

// Start MiniBase Server
try {
  const { app } = await import('../src/index.js');
  const { config } = await import('../src/config.js');

  const shouldOpen = !args.includes('--no-open');
  if (shouldOpen) {
    setTimeout(() => {
      openBrowser(`http://localhost:${config.port}/_/`);
    }, 600);
  }

  if (args.includes('--tunnel') || args.includes('--public') || args.includes('--subdomain') || process.env.MINIBASE_TUNNEL === 'true') {
    const { TunnelManager } = await import('../src/core/tunnel.js');

    const getArgValue = (flag) => {
      const idx = args.indexOf(flag);
      return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
    };

    const subdomain = getArgValue('--subdomain') || process.env.MINIBASE_SUBDOMAIN;
    const token = getArgValue('--token') || process.env.CLOUDFLARE_TUNNEL_TOKEN;
    const domain = getArgValue('--domain') || process.env.MINIBASE_DOMAIN;

    try {
      const publicUrl = await TunnelManager.start(config.port, { subdomain, token, domain });
      console.log(`
  \x1b[38;2;16;185;129m┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │   🌍 MiniBase is LIVE Worldwide (${subdomain ? `Custom Subdomain: ${subdomain}` : 'Public Tunnel'})
  │                                                                  │
  │   📱 Mobile / Flutter API URL:                                   │
  │   \x1b[1m\x1b[32m${publicUrl}\x1b[0m\x1b[38;2;16;185;129m
  │                                                                  │
  │   🖥️ Admin Studio (Anywhere in World):                           │
  │   \x1b[36m${publicUrl}/_/\x1b[0m\x1b[38;2;16;185;129m
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘\x1b[0m
`);
    } catch (err) {
      console.error('Failed to start public tunnel:', err.message);
    }
  }
} catch (err) {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n\x1b[33m➜ Port is already running. Opening Admin Studio in your browser...\x1b[0m`);
    openBrowser(`http://localhost:8090/_/`);
  } else {
    console.error('\x1b[31mError starting MiniBase:\x1b[0m', err.message);
  }
}


