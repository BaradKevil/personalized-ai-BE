/**
 * ===========================================
 *  Calendar Routes
 * ===========================================
 *
 * GET /api/calendar/events?month=YYYY-MM — dated tasks + goals
 */

import { Router } from 'express';
import { listMonthEvents } from '../controllers/calendar.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/events', listMonthEvents);

export default router;
