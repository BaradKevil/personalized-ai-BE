/**
 * ===========================================
 *  Authentication Routes
 * ===========================================
 *
 * Handles user registration, login, token refresh,
 * and logout. Applies Joi validation middleware.
 */

import { Router } from 'express';
import {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  changePassword,
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { verifyToken } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rate-limit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

/** Protect all authentication endpoints against brute-force attempts */
router.use(authLimiter);

/**
 * POST /api/auth/register
 * Registers a new user account and provisions agent + preferences.
 */
router.post('/register', validate(registerSchema), registerUser);

/**
 * POST /api/auth/login
 * Authenticates with email or mobile number + password.
 */
router.post('/login', validate(loginSchema), loginUser);

/**
 * POST /api/auth/refresh-token
 * Rotates and returns a new pair of access + refresh tokens.
 */
router.post('/refresh-token', validate(refreshTokenSchema), refreshTokens);

/**
 * POST /api/auth/logout
 * Revokes refresh token and logs out the user.
 */
router.post('/logout', logoutUser);

/**
 * POST /api/auth/change-password
 * Changes the authenticated user's password.
 * Protected — requires a valid JWT.
 */
router.post('/change-password', verifyToken, validate(changePasswordSchema), changePassword);

export default router;
