const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { getJwtSecret } = require('../config/jwt');

function readUserFromToken(token) {
  const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
  if (!decoded || !Number.isInteger(decoded.id)) return null;
  return db.prepare('SELECT id, name, email, role, phone, address, city, pincode FROM users WHERE id = ?').get(decoded.id) || null;
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== 'string' || !/^Bearer\s+\S+$/i.test(authHeader)) {
    return res.status(401).json({ success: false, message: 'Access denied. No valid authentication token provided.' });
  }

  try {
    const user = readUserFromToken(authHeader.split(/\s+/)[1]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token. User no longer exists.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired. Please log in again.' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && /^Bearer\s+\S+$/i.test(authHeader)) {
    try {
      req.user = readUserFromToken(authHeader.split(/\s+/)[1]) || undefined;
    } catch (error) {
      // Public routes continue without an authenticated user.
    }
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required.' });
  }
  return next();
}

module.exports = { authenticate, optionalAuth, requireAdmin };
