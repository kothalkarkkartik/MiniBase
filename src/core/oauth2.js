import { SettingsManager } from './mailer.js';
import { SchemaManager } from './schema.js';
import { AuthManager } from './auth.js';
import { getDB } from './db.js';
import { generateId, generateTokenKey } from '../utils/id.js';

export class OAuth2Manager {
  static getProviders() {
    const settings = SettingsManager.getAll();
    const oauth2 = settings.oauth2 || { google: { enabled: false }, github: { enabled: false } };
    const appUrl = settings.appUrl || 'http://localhost:8090';

    const providers = [];

    // 1. Google
    const google = oauth2.google;
    if (google && google.enabled && google.clientId) {
      const redirectUri = google.redirectUrl || `${appUrl}/api/oauth2-redirect`;
      const state = `google_${generateId(12)}`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        google.clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${encodeURIComponent(
        'openid email profile'
      )}&state=${state}&access_type=offline&prompt=select_account`;

      providers.push({
        name: 'google',
        displayName: 'Google',
        enabled: true,
        clientId: google.clientId,
        authUrl,
      });
    }

    // 2. GitHub
    const github = oauth2.github;
    if (github && github.enabled && github.clientId) {
      const redirectUri = github.redirectUrl || `${appUrl}/api/oauth2-redirect`;
      const state = `github_${generateId(12)}`;
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
        github.clientId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;

      providers.push({
        name: 'github',
        displayName: 'GitHub',
        enabled: true,
        clientId: github.clientId,
        authUrl,
      });
    }

    return providers;
  }

  static async exchangeGoogle(code, redirectUrl) {
    const settings = SettingsManager.getAll();
    const google = settings.oauth2?.google;
    if (!google || !google.enabled || !google.clientId || !google.clientSecret) {
      throw new Error('Google OAuth2 is not configured or enabled');
    }

    const redirectUri = redirectUrl || google.redirectUrl || `${settings.appUrl}/api/oauth2-redirect`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: google.clientId,
        client_secret: google.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange Google OAuth2 code');
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.email) {
      throw new Error('Failed to fetch user profile from Google');
    }

    return {
      id: userData.sub,
      email: userData.email.toLowerCase(),
      name: userData.name || userData.given_name,
      avatarUrl: userData.picture,
      raw: userData,
    };
  }

  static async exchangeGitHub(code, redirectUrl) {
    const settings = SettingsManager.getAll();
    const github = settings.oauth2?.github;
    if (!github || !github.enabled || !github.clientId || !github.clientSecret) {
      throw new Error('GitHub OAuth2 is not configured or enabled');
    }

    const redirectUri = redirectUrl || github.redirectUrl || `${settings.appUrl}/api/oauth2-redirect`;

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: github.clientId,
        client_secret: github.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange GitHub OAuth2 code');
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'MiniBase-Server',
      },
    });

    const userData = await userRes.json();
    let email = userData.email;

    // If primary email is private, fetch from emails endpoint
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'MiniBase-Server',
        },
      });
      const emails = await emailsRes.json();
      if (Array.isArray(emails)) {
        const primary = emails.find((e) => e.primary && e.verified) || emails[0];
        if (primary) email = primary.email;
      }
    }

    if (!email) {
      throw new Error('No verified email found on GitHub account');
    }

    return {
      id: String(userData.id),
      email: email.toLowerCase(),
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      raw: userData,
    };
  }

  static async authWithOAuth2(collectionNameOrObj, provider, code, redirectUrl) {
    const collection = typeof collectionNameOrObj === 'string'
      ? SchemaManager.getCollection(collectionNameOrObj)
      : collectionNameOrObj;

    if (!collection) {
      throw new Error(`Collection "${collectionNameOrObj}" not found`);
    }
    if (collection.type !== 'auth') {
      throw new Error(`Collection "${collection.name}" is not an auth collection`);
    }

    let profile;
    if (provider === 'google') {
      profile = await this.exchangeGoogle(code, redirectUrl);
    } else if (provider === 'github') {
      profile = await this.exchangeGitHub(code, redirectUrl);
    } else {
      throw new Error(`Unsupported OAuth2 provider "${provider}"`);
    }

    const db = getDB();
    const existing = db.queryOne(`SELECT * FROM "${collection.name}" WHERE email = ?`, [profile.email]);

    let userRecord;
    let isNew = false;
    const now = new Date().toISOString();

    if (existing) {
      userRecord = existing;
      // Mark verified if not verified
      if (!existing.verified) {
        db.run(`UPDATE "${collection.name}" SET verified = 1, updated = ? WHERE id = ?`, [now, existing.id]);
        userRecord.verified = 1;
      }
    } else {
      // Create new user record
      isNew = true;
      const recordId = generateId();
      const tokenKey = generateTokenKey();
      // Dummy random password hash for OAuth user
      const dummyPassHash = await AuthManager.hashPassword(generateId(32));

      const initialData = {
        id: recordId,
        email: profile.email,
        passwordHash: dummyPassHash,
        tokenKey,
        verified: 1,
        emailVisibility: 0,
        created: now,
        updated: now,
      };

      // Populate name/avatar if fields exist in schema
      if (collection.schema.some(f => f.name === 'name') && profile.name) {
        initialData.name = profile.name;
      }
      if (collection.schema.some(f => f.name === 'avatar') && profile.avatarUrl) {
        initialData.avatar = profile.avatarUrl;
      }

      const columns = Object.keys(initialData);
      const placeholders = columns.map(() => '?').join(', ');
      db.run(
        `INSERT INTO "${collection.name}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
        Object.values(initialData)
      );

      userRecord = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [recordId]);
    }

    const token = AuthManager.createToken({
      id: userRecord.id,
      type: 'user',
      collectionId: collection.id,
      collectionName: collection.name,
      tokenKey: userRecord.tokenKey,
      email: userRecord.email,
    });

    const clean = { ...userRecord };
    delete clean.passwordHash;
    delete clean.tokenKey;

    return { token, record: clean, isNew };
  }
}
