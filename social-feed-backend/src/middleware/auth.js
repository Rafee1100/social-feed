const User = require('../models/User');
const {
  verifyAccessToken,
  ACCESS_COOKIE,
  clearAuthCookies,
} = require('../utils/jwt');

const INACTIVITY_TIMEOUT_MINUTES = Number(process.env.INACTIVITY_TIMEOUT_MINUTES || 15);
const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;

/**
 * Protect middleware — verifies the JWT from the HttpOnly cookie.
 * Attaches the full user object to req.user.
 * Blocks the request with 401 if the token is missing or invalid.
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies[ACCESS_COOKIE];

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    const decodedToken = verifyAccessToken(token);
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    if (user.lastActiveAt) {
      const inactiveMs = Date.now() - user.lastActiveAt.getTime();
      if (inactiveMs > INACTIVITY_TIMEOUT_MS) {
        clearAuthCookies(res);
        return res
          .status(401)
          .json({ message: 'Session expired due to inactivity. Please log in again.' });
      }
    }
    user.lastActiveAt = new Date();
    user.save().catch(() => {});

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token. Please log in.' });
  }
};

module.exports = { protect };
