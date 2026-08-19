import { AuthManager } from '../core/auth.js';

export function authMiddleware(req, _res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    const payload = AuthManager.verifyToken(token);
    if (payload) {
      req.auth = payload;
      req.isAdmin = payload.type === 'admin';
    }
  }

  next();
}

export function requireAdmin(req, res, next) {
  if (!req.isAdmin) {
    res.status(403).json({
      code: 403,
      message: 'Only admins can perform this action',
      data: {},
    });
    return;
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.auth) {
    res.status(401).json({
      code: 401,
      message: 'Authentication required',
      data: {},
    });
    return;
  }
  next();
}
