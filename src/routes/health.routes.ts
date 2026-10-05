/**
 * ===========================================
 *  Health Check Routes
 * ===========================================
 *
 * GET /api/health — Returns server status information.
 */

import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller';

const router = Router();

/**
 * GET /api/health
 * Public endpoint — no authentication required.
 */
router.get('/', getHealthStatus);

export default router;
