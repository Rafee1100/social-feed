import express from 'express';
import { authLimiter } from '../config/rateLimitConfig.js';
import { getMe, login, logout, refresh, register } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { loginRules, registerRules } from '../middleware/validate.js';

const router = express.Router();
router.post('/register', authLimiter, registerRules, register);
router.post('/login', authLimiter, loginRules, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
