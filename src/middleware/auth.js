const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Verify JWT token — JWT-only verification for Docker/direct deployments.
 * Sets req.userId and req.userRole on success.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId   = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    logger.warn(`JWT verification failed: ${err.message}`);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Require admin role. Must be used AFTER verifyToken.
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { verifyToken, requireAdmin };
