/**
 * ===========================================
 *  Stats Routes
 * ===========================================
 *
 *  GET /api/stats/overview — productivity overview
 */

import { Router } from 'express';
import { getOverview } from '../controllers/stats.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /api/stats/overview
 * Protected — requires a valid JWT.
 */
router.get('/overview', verifyToken, getOverview);

export default router;
