/**
 * ===========================================
 *  Progress Routes
 * ===========================================
 *
 * GET /api/progress — goals + weekly + habit progress
 */

import { Router } from 'express';
import { getProgress } from '../controllers/progress.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', getProgress);

export default router;
