import { getDB } from './db.js';
import { generateId } from '../utils/id.js';

export class AppLogger {
  static middleware() {
    return (req, res, next) => {
      const start = performance.now();

      res.on('finish', () => {
        // Skip logging SSE ping or heartbeat spam
        if (req.path === '/api/realtime' && req.method === 'GET') {
          return;
        }

        const duration = Math.round((performance.now() - start) * 100) / 100;
        const auth = req.auth;
        const error = res.locals?.errorMessage || undefined;

        const log = {
          id: generateId(16),
          method: req.method,
          url: req.originalUrl || req.url,
          status: res.statusCode,
          ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
          userAgent: req.headers['user-agent'] || '',
          execTimeMs: duration,
          authType: auth?.type || (auth ? 'user' : 'guest'),
          authId: auth?.id || undefined,
          error,
          created: new Date().toISOString(),
        };

        try {
          const db = getDB();
          db.run(
            `INSERT INTO _logs (id, method, url, status, ip, userAgent, execTimeMs, authType, authId, error, created)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              log.id,
              log.method,
              log.url,
              log.status,
              log.ip,
              log.userAgent,
              log.execTimeMs,
              log.authType,
              log.authId,
              log.error,
              log.created,
            ]
          );
        } catch {
          // Fail silently on log write error
        }
      });

      next();
    };
  }

  static getLogs(page = 1, perPage = 50, filterStatus) {
    const db = getDB();
    const offset = (page - 1) * perPage;

    let whereClause = '';
    const params = [];

    if (filterStatus) {
      whereClause = 'WHERE status = ?';
      params.push(filterStatus);
    }

    const totalRow = db.queryOne(
      `SELECT COUNT(*) as count FROM _logs ${whereClause}`,
      params
    );
    const total = totalRow?.count || 0;

    const items = db.queryAll(
      `SELECT * FROM _logs ${whereClause} ORDER BY created DESC LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    return { items, total };
  }

  static clearLogs() {
    const db = getDB();
    db.run(`DELETE FROM _logs`);
  }
}
