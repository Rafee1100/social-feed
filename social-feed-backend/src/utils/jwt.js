import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const parseDurationToMs = (value, fallbackMs) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return fallbackMs;
  const match = value.trim().match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * multipliers[unit];
};

const getAccessMaxAgeMs = () => parseDurationToMs(ACCESS_EXPIRES_IN, 15 * 60 * 1000);
const getRefreshMaxAgeMs = () => parseDurationToMs(REFRESH_EXPIRES_IN, 30 * 24 * 60 * 60 * 1000);

const getCookieOptions = (maxAgeMs) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
  };
};

const signAccessToken = (userId) =>
  jwt.sign({ id: userId, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(ACCESS_COOKIE, accessToken, getCookieOptions(getAccessMaxAgeMs()));
  res.cookie(REFRESH_COOKIE, refreshToken, getCookieOptions(getRefreshMaxAgeMs()));
};

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, getCookieOptions(0));
  res.clearCookie(REFRESH_COOKIE, getCookieOptions(0));
};

const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.type !== 'access') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return payload;
};

const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.type !== 'refresh') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return payload;
};

export {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  getAccessMaxAgeMs,
  getRefreshMaxAgeMs,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  hashToken,
};
