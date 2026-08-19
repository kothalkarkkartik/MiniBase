import { getDB } from './db.js';
import { config } from '../config.js';
import { signJwt, verifyJwt } from './auth.js';

export const defaultSettings = {
  appName: 'MiniBase',
  appUrl: 'http://localhost:8090',
  smtp: {
    enabled: false,
    host: 'smtp.example.com',
    port: 587,
    username: '',
    password: '',
    tls: true,
    fromName: 'MiniBase Support',
    fromAddress: 'support@minibase.io',
  },
  oauth2: {
    google: {
      enabled: false,
      clientId: '',
      clientSecret: '',
    },
    github: {
      enabled: false,
      clientId: '',
      clientSecret: '',
    },
  },
};

export class SettingsManager {
  static getAll() {
    const db = getDB();
    const rows = db.queryAll(`SELECT * FROM _settings`);
    const settings = { ...defaultSettings };

    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }

    return settings;
  }

  static get(key, defaultValue) {
    const db = getDB();
    const row = db.queryOne(`SELECT value FROM _settings WHERE key = ?`, [key]);
    if (!row) return defaultValue !== undefined ? defaultValue : defaultSettings[key];
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }

  static set(key, value) {
    const db = getDB();
    const now = new Date().toISOString();
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

    db.run(
      `INSERT INTO _settings (key, value, updated) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated = excluded.updated`,
      [key, valStr, now]
    );
  }

  static updateAll(partial) {
    for (const [k, v] of Object.entries(partial)) {
      this.set(k, v);
    }
    return this.getAll();
  }
}

export class Mailer {
  static async getTransporter(customConfig = null) {
    const smtp = customConfig || SettingsManager.get('smtp', defaultSettings.smtp);
    if (!smtp || !smtp.enabled || !smtp.host) {
      return null;
    }

    const nodemailer = (await import('nodemailer')).default;
    const isSsl = Number(smtp.port) === 465;

    const transportOptions = {
      host: smtp.host.trim(),
      port: Number(smtp.port) || (isSsl ? 465 : 587),
      secure: isSsl,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    };

    if (smtp.username) {
      transportOptions.auth = {
        user: smtp.username.trim(),
        pass: smtp.password || '',
      };
    }

    if (!isSsl && smtp.tls !== false) {
      transportOptions.requireTLS = true;
    }

    transportOptions.tls = {
      rejectUnauthorized: smtp.tls !== false,
    };

    return nodemailer.createTransport(transportOptions);
  }

  static async verifyConnection(customConfig = null) {
    const smtp = customConfig || SettingsManager.get('smtp', defaultSettings.smtp);
    if (!smtp || !smtp.enabled) {
      throw new Error('SMTP is currently disabled. Please check "Enable SMTP Mail Delivery" and fill in your server credentials.');
    }
    if (!smtp.host) {
      throw new Error('SMTP Host is required (e.g. smtp.gmail.com or smtp.resend.com).');
    }

    const transporter = await this.getTransporter(smtp);
    if (!transporter) {
      throw new Error('Failed to initialize SMTP transporter. Check your server settings.');
    }

    try {
      await transporter.verify();
      return { success: true, message: 'SMTP connection & authentication verified successfully!' };
    } catch (err) {
      let friendlyMsg = err.message;
      if (err.code === 'EAUTH' || err.responseCode === 535) {
        friendlyMsg = 'Authentication failed (535): Invalid username or password. For Gmail, make sure to use an App Password instead of your regular password.';
      } else if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKET') {
        friendlyMsg = `Connection timed out connecting to ${smtp.host}:${smtp.port}. Verify host and port, or check firewall/network rules.`;
      } else if (err.code === 'ECONNREFUSED') {
        friendlyMsg = `Connection refused by ${smtp.host}:${smtp.port}. Ensure the SMTP server is running and accepting connections on this port.`;
      }
      throw new Error(friendlyMsg);
    }
  }

  static async sendMail(options, requireReal = false) {
    const smtp = SettingsManager.get('smtp', defaultSettings.smtp);
    const transporter = await this.getTransporter();

    if (!transporter) {
      if (requireReal) {
        throw new Error('Cannot send email: SMTP is disabled or not configured in Settings. Please enable SMTP and enter your credentials.');
      }

      // In dev/unconfigured mode, log email to console
      console.log(`
\x1b[33m[Mailer - SMTP Disabled / Console Mode]\x1b[0m
To: \x1b[36m${options.to}\x1b[0m
Subject: \x1b[1m${options.subject}\x1b[0m
Body:
${options.text || options.html}
----------------------------------------`);
      return { sent: true, mode: 'console', previewUrl: 'logged-to-console' };
    }

    const fromAddress = smtp.fromAddress ? smtp.fromAddress.trim() : 'support@minibase.io';
    const fromName = smtp.fromName ? smtp.fromName.trim() : 'MiniBase';

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]+>/g, ''),
      html: options.html,
    });

    return { sent: true, mode: 'smtp', messageId: info.messageId, response: info.response };
  }

  static createActionToken(payload) {
    return signJwt(
      {
        id: payload.id,
        email: payload.email,
        collectionName: payload.collectionName,
        action: payload.type,
      },
      config.jwtSecret + (payload.tokenKey || ''),
      2 * 3600 // 2 hours expiry
    );
  }

  static verifyActionToken(token, expectedAction, tokenKey = '') {
    const decoded = verifyJwt(token, config.jwtSecret + tokenKey);
    if (!decoded || decoded.action !== expectedAction) {
      throw new Error(`Invalid or expired action token. Please request a new link.`);
    }
    return decoded;
  }

  static async sendPasswordResetEmail(email, token, collectionName) {
    const settings = SettingsManager.getAll();
    const appUrl = (settings.appUrl || window?.location?.origin || 'http://localhost:8090').replace(/\/+$/, '');
    const resetUrl = `${appUrl}/_/#/confirm-password-reset?token=${encodeURIComponent(token)}`;
    const appName = settings.appName || 'MiniBase';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090A0F; color: #F1F5F9; margin: 0; padding: 32px 16px;">
        <div style="max-width: 540px; margin: 0 auto; background: #12141A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <div style="padding: 28px 32px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0) 100%);">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF; display: flex; align-items: center; gap: 8px;">
              <span style="color: #10B981;">⚡</span> ${appName}
            </h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 12px; font-size: 17px; font-weight: 700; color: #FFFFFF;">Reset your password</h2>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
              We received a request to reset the password for your <strong>${collectionName}</strong> account (<code>${email}</code>).
            </p>
            <div style="margin: 28px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #10B981; color: #042F1A; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(16,185,129,0.35);">
                Reset Password →
              </a>
            </div>
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748B;">Or copy and paste this link into your browser:</p>
            <p style="margin: 0 0 24px; font-size: 11.5px; color: #38BDF8; word-break: break-all; font-family: monospace; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
              ${resetUrl}
            </p>
            <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 18px; font-size: 12px; line-height: 1.5; color: #64748B;">
              If you didn't request a password reset, you can safely ignore this email. This link will expire in <strong>2 hours</strong>.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: email,
      subject: `Reset your ${appName} password`,
      html,
    });
  }

  static async sendVerificationEmail(email, token, collectionName) {
    const settings = SettingsManager.getAll();
    const appUrl = (settings.appUrl || window?.location?.origin || 'http://localhost:8090').replace(/\/+$/, '');
    const verifyUrl = `${appUrl}/_/#/confirm-verification?token=${encodeURIComponent(token)}`;
    const appName = settings.appName || 'MiniBase';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090A0F; color: #F1F5F9; margin: 0; padding: 32px 16px;">
        <div style="max-width: 540px; margin: 0 auto; background: #12141A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <div style="padding: 28px 32px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0) 100%);">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF; display: flex; align-items: center; gap: 8px;">
              <span style="color: #10B981;">⚡</span> ${appName}
            </h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 12px; font-size: 17px; font-weight: 700; color: #FFFFFF;">Verify your email address</h2>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
              Thank you for registering. Please click the button below to verify your email for your <strong>${collectionName}</strong> account.
            </p>
            <div style="margin: 28px 0;">
              <a href="${verifyUrl}" style="display: inline-block; background: #10B981; color: #042F1A; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(16,185,129,0.35);">
                Verify Email →
              </a>
            </div>
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748B;">Or copy and paste this link into your browser:</p>
            <p style="margin: 0 0 24px; font-size: 11.5px; color: #38BDF8; word-break: break-all; font-family: monospace; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
              ${verifyUrl}
            </p>
            <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 18px; font-size: 12px; line-height: 1.5; color: #64748B;">
              This verification link will expire in <strong>2 hours</strong>.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: email,
      subject: `Verify your email for ${appName}`,
      html,
    });
  }
}

export { Mailer as MailerManager };


