/**
 * ===========================================
 *  Activity Log Routes
 * ===========================================
 *
 * GET /api/activity-logs — Paginated list of the user's activity logs
 */

import { Router } from 'express';
import { listActivityLogs } from '../controllers/activity-log.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/** All activity log routes require a valid JWT */
router.use(verifyToken);

router.get('/', listActivityLogs);

export default router;
