/**
 * ===========================================
 *  Notification Routes
 * ===========================================
 *
 * GET    /api/notifications            — List notifications
 * POST   /api/notifications/read-all   — Mark all as read
 * GET    /api/notifications/unread-count — Unread count
 */

import { Router } from 'express';
import { listNotifications, markAllRead, unreadCount } from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/** All notification routes require a valid JWT */
router.use(verifyToken);

router.get('/', listNotifications);
router.post('/read-all', markAllRead);
router.get('/unread-count', unreadCount);

export default router;
