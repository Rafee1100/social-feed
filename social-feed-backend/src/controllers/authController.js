const User = require('../models/User');
const {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
  hashToken,
  getRefreshMaxAgeMs,
  REFRESH_COOKIE,
} = require('../utils/jwt');
const { createError } = require('../middleware/error');

const INACTIVITY_TIMEOUT_MINUTES = Number(process.env.INACTIVITY_TIMEOUT_MINUTES || 15);
const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;

const issueTokens = async (res, user) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  setAuthCookies(res, accessToken, refreshToken);

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + getRefreshMaxAgeMs());
  user.lastActiveAt = new Date();
  await user.save();
};

/**
 * POST /api/auth/register
 * Creates a new user account and sets the JWT cookie.
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return next(createError(409, 'An account with this email already exists.'));
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash: password,
    });

    await issueTokens(res, user);

    res.status(201).json({
      message: 'Account created successfully.',
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Validates credentials and sets the JWT cookie.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return next(createError(401, 'Invalid email or password.'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError(401, 'Invalid email or password.'));
    }

    await issueTokens(res, user);

    res.json({
      message: 'Logged in successfully.',
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clears the JWT cookie.
 */
const logout = async (req, res, next) => {
  try {
    clearAuthCookies(res);
    if (req.user) {
      req.user.refreshTokenHash = null;
      req.user.refreshTokenExpiresAt = null;
      req.user.lastActiveAt = null;
      await req.user.save();
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Rotates refresh token and issues a fresh access token.
 */
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE];
    if (!refreshToken) {
      return next(createError(401, 'Refresh token missing. Please log in again.'));
    }

    const decodedToken = verifyRefreshToken(refreshToken);

    const user = await User.findById(decodedToken.id).select(
      '+refreshTokenHash +refreshTokenExpiresAt +lastActiveAt'
    );
    if (!user) {
      clearAuthCookies(res);
      return next(createError(401, 'User no longer exists.'));
    }

    if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
      clearAuthCookies(res);
      return next(createError(401, 'Invalid refresh token. Please log in again.'));
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
      clearAuthCookies(res);
      return next(createError(401, 'Refresh token expired. Please log in again.'));
    }

    if (user.lastActiveAt) {
      const inactiveMs = Date.now() - user.lastActiveAt.getTime();
      if (inactiveMs > INACTIVITY_TIMEOUT_MS) {
        clearAuthCookies(res);
        user.refreshTokenHash = null;
        user.refreshTokenExpiresAt = null;
        user.lastActiveAt = null;
        await user.save();
        return next(
          createError(401, 'Session expired due to inactivity. Please log in again.')
        );
      }
    }

    await issueTokens(res, user);

    res.json({ message: 'Session refreshed.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      clearAuthCookies(res);
      return next(createError(401, 'Refresh token expired. Please log in again.'));
    }
    return next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
const getMe = (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

module.exports = { register, login, logout, refresh, getMe };
