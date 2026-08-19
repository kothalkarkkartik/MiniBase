import crypto from 'node:crypto';
import { config } from '../config.js';
import { getDB } from './db.js';
import { generateId, generateTokenKey } from '../utils/id.js';
import { SchemaManager } from './schema.js';

// --- Lightweight Native JWT Implementation (Zero Dependencies) ---
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function signJwt(payload, secret, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

export function verifyJwt(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');

  if (signature.length !== expectedSignature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

// Parse expiry string like '7d', '2h', '30m' to seconds
function parseExpiryToSeconds(expiryStr = '7d') {
  if (typeof expiryStr === 'number') return expiryStr;
  const match = String(expiryStr).match(/^(\d+)([smhd])?$/);
  if (!match) return 7 * 24 * 3600;
  const val = parseInt(match[1], 10);
  const unit = match[2] || 's';
  switch (unit) {
    case 's': return val;
    case 'm': return val * 60;
    case 'h': return val * 3600;
    case 'd': return val * 86400;
    default: return val;
  }
}

// --- Lightweight Native Password Hashing (Using crypto.scrypt + timingSafeEqual) ---
export class AuthManager {
  static hashPassword(password) {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  static async verifyPassword(password, storedHash) {
    if (!storedHash || typeof storedHash !== 'string') return false;

    // 1. Native scrypt hash format: scrypt:salt:key
    if (storedHash.startsWith('scrypt:')) {
      const [, salt, key] = storedHash.split(':');
      if (!salt || !key) return false;

      return new Promise((resolve) => {
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
          if (err) return resolve(false);
          const keyBuffer = Buffer.from(key, 'hex');
          if (derivedKey.length !== keyBuffer.length) return resolve(false);
          resolve(crypto.timingSafeEqual(derivedKey, keyBuffer));
        });
      });
    }

    // 2. Fallback for legacy bcrypt hashes if bcryptjs is available
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      try {
        const bcrypt = (await import('bcryptjs')).default;
        return bcrypt.compare(password, storedHash);
      } catch {
        return false;
      }
    }

    return false;
  }

  static createToken(payload) {
    const expirySec = parseExpiryToSeconds(config.jwtExpiry);
    return signJwt(payload, config.jwtSecret, expirySec);
  }

  static verifyToken(token) {
    const decoded = verifyJwt(token, config.jwtSecret);
    if (!decoded) return null;

    const db = getDB();

    // Check if tokenKey is still valid in database
    if (decoded.type === 'admin') {
      const admin = db.queryOne(`SELECT * FROM _admins WHERE id = ?`, [decoded.id]);
      if (!admin || admin.tokenKey !== decoded.tokenKey) {
        return null;
      }
    } else if (decoded.type === 'user' && decoded.collectionName) {
      const user = db.queryOne(
        `SELECT * FROM "${decoded.collectionName}" WHERE id = ?`,
        [decoded.id]
      );
      if (!user || user.tokenKey !== decoded.tokenKey) {
        return null;
      }
    }

    return decoded;
  }

  static hasAnyAdmin() {
    const db = getDB();
    const count = db.queryOne(`SELECT count(*) as count FROM _admins`);
    return (count?.count || 0) > 0;
  }

  static async createInitialAdmin(email, password) {
    const db = getDB();
    if (this.hasAnyAdmin()) {
      throw new Error('Initial admin can only be created when no admins exist');
    }

    if (!email || !password || password.length < 8) {
      throw new Error('Email is required and password must be at least 8 characters');
    }

    const now = new Date().toISOString();
    const id = generateId();
    const passwordHash = await this.hashPassword(password);
    const tokenKey = generateTokenKey();

    const admin = {
      id,
      email: email.toLowerCase().trim(),
      passwordHash,
      tokenKey,
      created: now,
      updated: now,
    };

    db.run(
      `INSERT INTO _admins (id, email, passwordHash, tokenKey, avatar, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [admin.id, admin.email, admin.passwordHash, admin.tokenKey, null, admin.created, admin.updated]
    );

    return admin;
  }

  static async adminAuthWithPassword(email, password) {
    const db = getDB();
    const admin = db.queryOne(`SELECT * FROM _admins WHERE email = ?`, [email.toLowerCase().trim()]);

    if (!admin) {
      throw new Error('Invalid email or password');
    }

    const isValid = await this.verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.createToken({
      id: admin.id,
      type: 'admin',
      tokenKey: admin.tokenKey,
      email: admin.email,
    });

    const { passwordHash, tokenKey, ...adminData } = admin;
    return { token, admin: adminData };
  }

  static async recordAuthWithPassword(collectionName, email, password) {
    const db = getDB();
    const collection = SchemaManager.getCollection(collectionName);

    if (!collection) {
      throw new Error(`Collection "${collectionName}" not found`);
    }

    if (collection.type !== 'auth') {
      throw new Error(`Collection "${collectionName}" is not an auth collection`);
    }

    const record = db.queryOne(
      `SELECT * FROM "${collection.name}" WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (!record) {
      throw new Error('Invalid email or password');
    }

    const isValid = await this.verifyPassword(password, record.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.createToken({
      id: record.id,
      type: 'user',
      collectionId: collection.id,
      collectionName: collection.name,
      tokenKey: record.tokenKey,
      email: record.email,
    });

    const { passwordHash, tokenKey, ...cleanRecord } = record;
    return { token, record: cleanRecord };
  }
}
