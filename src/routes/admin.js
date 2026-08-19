import { Router } from 'express';
import fs from 'node:fs';
import { AuthManager, decodeJwt } from '../core/auth.js';
import { SchemaManager } from '../core/schema.js';
import { MailerManager } from '../core/mailer.js';
import { getDB } from '../core/db.js';
import { config } from '../config.js';
import { AppLogger } from '../core/logger.js';
import { RealtimeHub } from '../core/realtime.js';
import { requireAdmin } from '../middleware/auth.js';
import { generateId, generateTokenKey } from '../utils/id.js';

export const adminRouter = Router();

// Check if any admin exists (for first-run setup UI)
adminRouter.get('/has-admin', (_req, res) => {
  const hasAdmin = AuthManager.hasAnyAdmin();
  res.json({ hasAdmin });
});

// Setup initial admin (only allowed if 0 admins exist)
adminRouter.post('/setup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await AuthManager.createInitialAdmin(email, password);

    const token = AuthManager.createToken({
      id: admin.id,
      type: 'admin',
      tokenKey: admin.tokenKey,
      email: admin.email,
    });

    res.status(201).json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        created: admin.created,
        updated: admin.updated,
      },
    });
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: error.message || 'Setup failed',
    });
  }
});

// Admin authentication with email and password
adminRouter.post('/auth-with-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ code: 400, message: 'Email and password are required' });
      return;
    }

    const result = await AuthManager.adminAuthWithPassword(email, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: error.message || 'Authentication failed',
    });
  }
});

// Admin Request Password Reset
adminRouter.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ code: 400, message: 'Email is required' });
      return;
    }

    const db = getDB();
    const admin = db.queryOne(`SELECT * FROM _admins WHERE email = ?`, [email.toLowerCase().trim()]);
    if (!admin) {
      // Return 200 for security to prevent email enumeration
      res.json({ message: 'If an admin account with that email exists, a password reset link has been sent' });
      return;
    }

    const token = MailerManager.createActionToken({
      id: admin.id,
      email: admin.email,
      collectionName: '_admins',
      action: 'password-reset',
      tokenKey: admin.tokenKey,
    });

    await MailerManager.sendPasswordResetEmail(admin.email, token, 'Admin');

    res.json({
      message: 'Password reset link sent successfully! Check your email or terminal.',
      resetUrl: `/_/#/confirm-password-reset?token=${encodeURIComponent(token)}`,
      token
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// Admin Confirm Password Reset
adminRouter.post('/confirm-password-reset', async (req, res) => {
  try {
    const { token, password, passwordConfirm } = req.body;
    if (!token || !password) {
      res.status(400).json({ code: 400, message: 'Token and new password are required' });
      return;
    }

    if (passwordConfirm && password !== passwordConfirm) {
      res.status(400).json({ code: 400, message: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ code: 400, message: 'Password must be at least 8 characters' });
      return;
    }

    const db = getDB();
    const decodedUnsafe = decodeJwt(token);
    if (!decodedUnsafe?.id) {
      res.status(400).json({ code: 400, message: 'Invalid or malformed reset token' });
      return;
    }

    const admin = db.queryOne(`SELECT * FROM _admins WHERE id = ?`, [decodedUnsafe.id]);
    if (!admin) {
      res.status(404).json({ code: 404, message: 'Admin account not found' });
      return;
    }

    MailerManager.verifyActionToken(token, 'password-reset', admin.tokenKey);

    const newHash = await AuthManager.hashPassword(password);
    const newTokenKey = generateTokenKey();
    const now = new Date().toISOString();

    db.run(
      `UPDATE _admins SET passwordHash = ?, tokenKey = ?, updated = ? WHERE id = ?`,
      [newHash, newTokenKey, now, admin.id]
    );

    res.json({ message: 'Admin password reset successfully! You can now sign in.' });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// Refresh admin token
adminRouter.post('/refresh-token', requireAdmin, (req, res) => {
  const admin = req.auth;
  const token = AuthManager.createToken({
    id: admin.id,
    type: 'admin',
    tokenKey: admin.tokenKey,
    email: admin.email,
  });

  res.json({ token });
});

// List all admins
adminRouter.get('/', requireAdmin, (_req, res) => {
  const db = getDB();
  const admins = db.queryAll(
    `SELECT id, email, avatar, created, updated FROM _admins ORDER BY created ASC`
  );
  res.json({ items: admins });
});

// Create new admin
adminRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 8) {
      res.status(400).json({ code: 400, message: 'Email is required and password must be at least 8 characters' });
      return;
    }

    const db = getDB();
    const existing = db.queryOne(`SELECT id FROM _admins WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existing) {
      res.status(400).json({ code: 400, message: 'Admin with this email already exists' });
      return;
    }

    const now = new Date().toISOString();
    const id = generateId();
    const passwordHash = await AuthManager.hashPassword(password);
    const tokenKey = generateTokenKey();

    db.run(
      `INSERT INTO _admins (id, email, passwordHash, tokenKey, avatar, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, email.toLowerCase().trim(), passwordHash, tokenKey, null, now, now]
    );

    res.status(201).json({
      id,
      email: email.toLowerCase().trim(),
      created: now,
      updated: now,
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});


// System Stats
adminRouter.get('/stats', requireAdmin, (_req, res) => {
  const db = getDB();
  const collections = SchemaManager.getAllCollections();

  let totalRecords = 0;
  const collectionStats = collections.map(c => {
    try {
      const count = db.queryOne(`SELECT COUNT(*) as count FROM "${c.name}"`);
      const recordCount = count?.count || 0;
      totalRecords += recordCount;
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        recordCount,
      };
    } catch {
      return { id: c.id, name: c.name, type: c.type, recordCount: 0 };
    }
  });

  let dbSizeBytes = 0;
  try {
    const stat = fs.statSync(config.dbPath);
    dbSizeBytes = stat.size;
  } catch {
    //
  }

  res.json({
    totalCollections: collections.length,
    totalRecords,
    activeRealtimeClients: RealtimeHub.getActiveClientCount(),
    dbSizeBytes,
    dbPath: config.dbPath,
    dataDir: config.dataDir,
    storageDir: config.storageDir,
    appName: config.appName,
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    collections: collectionStats,
  });
});

// Request Logs
adminRouter.get('/logs', requireAdmin, (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const perPage = parseInt(req.query.perPage || '50', 10);
  const status = req.query.status ? parseInt(req.query.status, 10) : undefined;

  const result = AppLogger.getLogs(page, perPage, status);
  res.json({
    page,
    perPage,
    totalPages: Math.ceil(result.total / perPage),
    totalItems: result.total,
    items: result.items,
  });
});

// Clear Logs
adminRouter.delete('/logs', requireAdmin, (_req, res) => {
  AppLogger.clearLogs();
  res.json({ message: 'Logs cleared successfully' });
});

// Database Backup / Download
adminRouter.get('/backup', requireAdmin, (_req, res) => {
  if (!fs.existsSync(config.dbPath)) {
    res.status(404).json({ code: 404, message: 'Database file not found' });
    return;
  }

  const filename = `minibase_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/x-sqlite3');

  const stream = fs.createReadStream(config.dbPath);
  stream.pipe(res);
});

// System Settings Management
adminRouter.get('/settings', requireAdmin, async (_req, res) => {
  const { SettingsManager } = await import('../core/mailer.js');
  const settings = SettingsManager.getAll();
  // Sanitize passwords in response
  const sanitized = JSON.parse(JSON.stringify(settings));
  if (sanitized.smtp?.password) sanitized.smtp.password = '********';
  if (sanitized.oauth2?.google?.clientSecret) sanitized.oauth2.google.clientSecret = '********';
  if (sanitized.oauth2?.github?.clientSecret) sanitized.oauth2.github.clientSecret = '********';
  res.json(sanitized);
});

adminRouter.patch('/settings', requireAdmin, async (req, res) => {
  try {
    const { SettingsManager } = await import('../core/mailer.js');
    const existing = SettingsManager.getAll();
    const updates = req.body;

    // Retain secrets if not changed
    if (updates.smtp && updates.smtp.password === '********') {
      updates.smtp.password = existing.smtp?.password || '';
    }
    if (updates.oauth2?.google && updates.oauth2.google.clientSecret === '********') {
      updates.oauth2.google.clientSecret = existing.oauth2?.google?.clientSecret || '';
    }
    if (updates.oauth2?.github && updates.oauth2.github.clientSecret === '********') {
      updates.oauth2.github.clientSecret = existing.oauth2?.github?.clientSecret || '';
    }

    const updated = SettingsManager.updateAll(updates);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

// Send Test Email (Real SMTP Verification & Delivery)
adminRouter.post('/test-email', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ code: 400, message: 'Valid recipient email address is required' });
      return;
    }

    const { Mailer, SettingsManager } = await import('../core/mailer.js');
    const settings = SettingsManager.getAll();
    const smtp = settings.smtp || {};

    if (!smtp.enabled) {
      res.status(400).json({
        code: 400,
        message: 'SMTP is currently disabled. Enable SMTP in Settings and click "Save Mail Settings" first.',
      });
      return;
    }

    // Verify SMTP connection first
    await Mailer.verifyConnection(smtp);

    const appName = settings.appName || 'MiniBase';
    const fromAddress = smtp.fromAddress || 'support@minibase.io';

    const result = await Mailer.sendMail(
      {
        to: email.trim(),
        subject: `⚡ ${appName} - SMTP Configuration Test`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090A0F; color: #F1F5F9; margin: 0; padding: 32px 16px;">
            <div style="max-width: 520px; margin: 0 auto; background: #12141A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              <div style="padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0) 100%);">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF; display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981;">⚡</span> ${appName} SMTP Verified
                </h1>
              </div>
              <div style="padding: 28px 32px;">
                <div style="display: inline-block; padding: 4px 12px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; color: #10B981; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
                  ✓ Email Delivery Active
                </div>
                <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #FFFFFF;">Congratulations!</h2>
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                  Your SMTP server (<code>${smtp.host}:${smtp.port}</code>) is correctly authenticated and ready to send password reset links and account verification emails.
                </p>
                <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 12px; color: #64748B;">
                  <div><strong>From:</strong> ${smtp.fromName || appName} &lt;${fromAddress}&gt;</div>
                  <div style="margin-top: 4px;"><strong>To:</strong> ${email}</div>
                  <div style="margin-top: 4px;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      true // requireReal = true
    );

    res.json({
      message: `Test email sent successfully to ${email}`,
      messageId: result.messageId,
      host: smtp.host,
    });
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

// Delete admin account by ID (placed after static routes)
adminRouter.delete('/:id', requireAdmin, (req, res) => {
  const db = getDB();
  const adminId = req.params.id;

  if (adminId === req.auth?.id) {
    res.status(400).json({ code: 400, message: 'You cannot delete your own admin account' });
    return;
  }

  const count = db.queryOne(`SELECT COUNT(*) as count FROM _admins`);
  if ((count?.count || 0) <= 1) {
    res.status(400).json({ code: 400, message: 'Cannot delete the only admin account' });
    return;
  }

  db.run(`DELETE FROM _admins WHERE id = ?`, [adminId]);
  res.json({ message: 'Admin deleted successfully' });
});

