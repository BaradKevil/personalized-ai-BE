/**
 * ===========================================
 *  User Routes
 * ===========================================
 *
 * GET  /api/users/profile — Fetch authenticated user's profile
 * PUT  /api/users/profile — Update authenticated user's profile
 */

import { Router } from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/user.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema, deleteAccountSchema } from '../validators/user.validator';

const router = Router();

/**
 * GET /api/users/profile
 * Protected — requires a valid JWT.
 */
router.get('/profile', verifyToken, getProfile);

/**
 * PUT /api/users/profile
 * Protected — requires a valid JWT.
 */
router.put('/profile', verifyToken, validate(updateProfileSchema), updateProfile);

/** Middleware to extract password from header if body was stripped by proxy */
const extractPasswordConfirmation = (req: any, _res: any, next: any) => {
  if (!req.body?.password && req.headers['x-password']) {
    req.body = { ...req.body, password: req.headers['x-password'] };
  }
  next();
};

/**
 * DELETE /api/users/me
 * Permanently deletes the account. Protected — requires a valid JWT.
 */
router.delete('/me', verifyToken, extractPasswordConfirmation, validate(deleteAccountSchema), deleteAccount);

/**
 * POST /api/users/me/delete
 * Alternative route for proxies/gateways that strip DELETE request bodies.
 */
router.post('/me/delete', verifyToken, extractPasswordConfirmation, validate(deleteAccountSchema), deleteAccount);

export default router;

