/**
 * ===========================================
 *  Settings Routes
 * ===========================================
 *
 * GET  /api/settings — Fetch the user's preferences
 * PUT  /api/settings — Update the user's preferences
 */

import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateSettingsSchema } from '../validators/settings.validator';

const router = Router();

/**
 * GET /api/settings
 * Protected — requires a valid JWT.
 */
router.get('/', verifyToken, getSettings);

/**
 * PUT /api/settings
 * Protected — requires a valid JWT.
 */
router.put('/', verifyToken, validate(updateSettingsSchema), updateSettings);

export default router;
