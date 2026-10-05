/**
 * ===========================================
 *  Daily Briefing Routes
 * ===========================================
 *
 * GET /api/daily-briefing — The user's daily briefing
 */

import { Router } from 'express';
import { getDailyBriefing } from '../controllers/daily-briefing.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/** Requires a valid JWT */
router.use(verifyToken);

router.get('/', getDailyBriefing);

export default router;
