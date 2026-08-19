import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { config } from './config.js';
import { getDB } from './core/db.js';
import { authMiddleware } from './middleware/auth.js';
import { AppLogger } from './core/logger.js';
import { adminRouter } from './routes/admin.js';
import { collectionsRouter } from './routes/collections.js';
import { recordsRouter } from './routes/records.js';
import { batchRouter } from './routes/batch.js';
import { filesRouter } from './routes/files.js';
import { realtimeRouter } from './routes/realtime.js';
import { HookManager } from './core/hooks.js';

export const app = express();

// Initialize DB and load hooks early
getDB();
HookManager.loadUserHooks().catch(err => {
  console.error('[Hooks] Error loading user hooks:', err);
});

// Zero-Dependency Native CORS Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(authMiddleware);
app.use(AppLogger.middleware());

// REST API Routers
app.use('/api/admins', adminRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/collections', recordsRouter);
app.use('/api/batch', batchRouter);
app.use('/api/files', filesRouter);
app.use('/api/realtime', realtimeRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    app: config.appName,
    timestamp: new Date().toISOString(),
  });
});

// Admin UI Static Assets
const adminUiDir = path.resolve('./public');
if (!fs.existsSync(adminUiDir)) {
  fs.mkdirSync(adminUiDir, { recursive: true });
}

// Serve public static folder
app.use(express.static(adminUiDir));
app.use('/_admin', express.static(adminUiDir));
app.use('/_', express.static(adminUiDir));

// Fallback for Admin UI SPA Routing
app.get(['/', '/_/*', '/_'], (_req, res) => {
  const indexPath = path.join(adminUiDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>MiniBase</title><meta charset="utf-8"/></head>
      <body style="font-family:system-ui; background:#0B0F17; color:#E2E8F0; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
        <div style="text-align:center;">
          <h1 style="color:#10B981; margin-bottom:8px;">⚡ MiniBase Backend is Running</h1>
          <p style="color:#94A3B8;">REST API available at <a href="/api/health" style="color:#38BDF8;">/api/health</a></p>
          <p style="color:#64748B; font-size:14px;">Admin dashboard is being built...</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Global error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    code: status,
    message,
    data: {},
  });
});

import https from 'node:https';
import { SslManager } from './core/ssl.js';

// Start Server if run directly
if (process.env.NODE_ENV !== 'test') {
  const sslOptions = SslManager.getSslOptions(config);

  if (sslOptions && sslOptions.cert && sslOptions.key) {
    // Start HTTPS Server
    const httpsServer = https.createServer(
      {
        cert: sslOptions.cert,
        key: sslOptions.key,
      },
      app
    );

    const sslPort = config.httpsPort || 8443;
    httpsServer.listen(sslPort, config.host, () => {
      console.log(`
  \x1b[38;2;16;185;129m
  ███╗   ███╗██╗███╗   ██╗██╗██████╗  █████╗ ███████╗███████╗
  ████╗ ████║██║████╗  ██║██║██╔══██╗██╔══██╗██╔════╝██╔════╝
  ██╔████╔██║██║██╔██╗ ██║██║██████╔╝███████║███████╗█████╗  
  ██║╚██╔╝██║██║██║╚██╗██║██║██╔══██╗██╔══██║╚════██║██╔══╝  
  ██║ ╚═╝ ██║██║██║ ╚████║██║██████╔╝██║  ██║███████║███████╗
  ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
  \x1b[0m
  \x1b[32m🔒 HTTPS / SSL Active (${sslOptions.type})\x1b[0m
  \x1b[36m➜\x1b[0m \x1b[1mAdmin UI:\x1b[0m    \x1b[32mhttps://localhost:${sslPort}/_/\x1b[0m
  \x1b[36m➜\x1b[0m \x1b[1mREST API:\x1b[0m    \x1b[32mhttps://localhost:${sslPort}/api/collections\x1b[0m
  \x1b[36m➜\x1b[0m \x1b[1mRealtime:\x1b[0m    \x1b[32mhttps://localhost:${sslPort}/api/realtime\x1b[0m
  \x1b[36m➜\x1b[0m \x1b[1mData Path:\x1b[0m   \x1b[90m${config.dataDir}\x1b[0m
`);
    });

    // Also run HTTP redirect or fallback on standard port
    app.listen(config.port, config.host, () => {
      console.log(`  \x1b[90m➜ HTTP fallback running on http://localhost:${config.port}\x1b[0m`);
    });
  } else {
    // Standard HTTP Server
    app.listen(config.port, config.host, () => {
      console.log(`
  \x1b[38;2;16;185;129m
  ███╗   ███╗██╗███╗   ██╗██╗██████╗  █████╗ ███████╗███████╗
  ████╗ ████║██║████╗  ██║██║██╔══██╗██╔══██╗██╔════╝██╔════╝
  ██╔████╔██║██║██╔██╗ ██║██║██████╔╝███████║███████╗█████╗  
  ██║╚██╔╝██║██║██║╚██╗██║██║██╔══██╗██╔══██║╚════██║██╔══╝  
  ██║ ╚═╝ ██║██║██║ ╚████║██║██████╔╝██║  ██║███████║███████╗
  ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
  \x1b[0m
  \x1b[36m➜\x1b[0m \x1b[1mAdmin UI:\x1b[0m    \x1b[32mhttp://localhost:${config.port}/_/\x1b[0m
  \x1b[36m➜\x1b[0m \x1b[1mREST API:\x1b[0m    \x1b[32mhttp://localhost:${config.port}/api/collections\x1b[0m
  \x1b[36m➜\x1b[0m \x1b[1mRealtime:\x1b[0m    \x1b[32mhttp://localhost:${config.port}/api/realtime\x1b[0m
  \x1b[36m➜\x1b[0m \x1b[1mData Path:\x1b[0m   \x1b[90m${config.dataDir}\x1b[0m
`);
    });
  }
}

