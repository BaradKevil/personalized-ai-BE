/**
 * ===========================================
 *  Reminder Routes
 * ===========================================
 *
 * GET /api/reminders/upcoming?days=7 — upcoming reminders
 */

import { Router } from 'express';
import { listUpcoming } from '../controllers/reminder.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/upcoming', listUpcoming);

export default router;
