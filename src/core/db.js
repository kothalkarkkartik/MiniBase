import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

export class Database {
  static instance;
  db;

  constructor(dbPath) {
    this.db = new DatabaseSync(dbPath);
    this.configure();
    this.initSystemTables();
  }

  static getInstance(dbPath = config.dbPath) {
    if (!Database.instance) {
      Database.instance = new Database(dbPath);
    }
    return Database.instance;
  }

  configure() {
    // Optimize SQLite for high-concurrency read/write operations
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      PRAGMA synchronous = NORMAL;
      PRAGMA cache_size = -64000; -- 64MB cache
    `);
  }

  initSystemTables() {
    // 1. _collections table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _collections (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL DEFAULT 'base',
        schema TEXT NOT NULL DEFAULT '[]',
        listRule TEXT,
        viewRule TEXT,
        createRule TEXT,
        updateRule TEXT,
        deleteRule TEXT,
        indexes TEXT DEFAULT '[]',
        options TEXT DEFAULT '{}',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      );
    `);

    // 2. _admins table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _admins (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        tokenKey TEXT NOT NULL,
        avatar TEXT,
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      );
    `);

    // 3. _logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _logs (
        id TEXT PRIMARY KEY,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        status INTEGER NOT NULL,
        ip TEXT NOT NULL,
        userAgent TEXT,
        execTimeMs REAL NOT NULL,
        authType TEXT,
        authId TEXT,
        error TEXT,
        created TEXT NOT NULL
      );
    `);

    // 4. _settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated TEXT NOT NULL
      );
    `);

    // Create indexes for system tables
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_logs_created ON _logs(created DESC);
      CREATE INDEX IF NOT EXISTS idx_logs_status ON _logs(status);
      CREATE INDEX IF NOT EXISTS idx_collections_name ON _collections(name);
    `);
  }

  exec(sql) {
    this.db.exec(sql);
  }

  queryAll(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const sanitizedParams = params.map(p => this.sanitizeParam(p));
    return stmt.all(...sanitizedParams);
  }

  queryOne(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const sanitizedParams = params.map(p => this.sanitizeParam(p));
    const result = stmt.get(...sanitizedParams);
    return result ?? null;
  }

  run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const sanitizedParams = params.map(p => this.sanitizeParam(p));
    return stmt.run(...sanitizedParams);
  }

  transaction(callback) {
    this.exec('BEGIN IMMEDIATE');
    try {
      const result = callback(this);
      this.exec('COMMIT');
      return result;
    } catch (error) {
      this.exec('ROLLBACK');
      throw error;
    }
  }

  sanitizeParam(param) {
    if (param === undefined) return null;
    if (typeof param === 'boolean') return param ? 1 : 0;
    if (param instanceof Date) return param.toISOString();
    if (typeof param === 'object' && param !== null) return JSON.stringify(param);
    return param;
  }

  close() {
    this.db.close();
  }
}

export const getDB = () => Database.getInstance();
