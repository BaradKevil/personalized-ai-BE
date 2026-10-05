/**
 * ===========================================
 *  Insight Routes
 * ===========================================
 *
 * GET /api/insights — data-backed personal insights
 */

import { Router } from 'express';
import { listInsights } from '../controllers/insight.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', listInsights);

export default router;
