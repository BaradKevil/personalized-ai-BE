/**
 * ===========================================
 *  Central Route Registry
 * ===========================================
 *
 * Aggregates all feature routers and mounts them
 * under their API prefixes. New feature routers
 * are registered here.
 */

import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import agentRoutes from './agent.routes';
import settingsRoutes from './settings.routes';
import chatRoutes from './chat.routes';
import memoryRoutes from './memory.routes';
import taskRoutes from './task.routes';
import goalRoutes from './goal.routes';
import notificationRoutes from './notification.routes';
import activityLogRoutes from './activity-log.routes';
import dailyBriefingRoutes from './daily-briefing.routes';
import statsRoutes from './stats.routes';
import habitRoutes from './habit.routes';
import calendarRoutes from './calendar.routes';
import reminderRoutes from './reminder.routes';
import insightRoutes from './insight.routes';
import progressRoutes from './progress.routes';

const router = Router();

// -------------------------------------------------
//  Public Routes
// -------------------------------------------------

/** GET /api/health */
router.use('/health', healthRoutes);

/** /api/auth — register, login, refresh-token, logout */
router.use('/auth', authRoutes);

// -------------------------------------------------
//  Protected Routes (require JWT)
// -------------------------------------------------

/** /api/users — profile */
router.use('/users', userRoutes);

/** /api/agent — personal AI agent */
router.use('/agent', agentRoutes);

/** /api/settings — user preferences */
router.use('/settings', settingsRoutes);

/** /api/chat — conversations, messages, AI */
router.use('/chat', chatRoutes);

/** /api/memory — personal memory */
router.use('/memory', memoryRoutes);

/** /api/tasks — task management */
router.use('/tasks', taskRoutes);

/** /api/goals — goal management */
router.use('/goals', goalRoutes);

/** /api/notifications — notifications */
router.use('/notifications', notificationRoutes);

/** /api/activity-logs — audit trail */
router.use('/activity-logs', activityLogRoutes);

/** /api/daily-briefing — daily briefing */
router.use('/daily-briefing', dailyBriefingRoutes);

/** /api/stats — productivity overview */
router.use('/stats', statsRoutes);

/** /api/habits — habit tracking */
router.use('/habits', habitRoutes);

/** /api/calendar — dated tasks + goals */
router.use('/calendar', calendarRoutes);

/** /api/reminders — upcoming reminders */
router.use('/reminders', reminderRoutes);

/** /api/insights — data-backed insights */
router.use('/insights', insightRoutes);

/** /api/progress — progress overview */
router.use('/progress', progressRoutes);

export default router;
