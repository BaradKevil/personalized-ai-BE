/**
 * ===========================================
 *  Reminder Controller
 * ===========================================
 */

import { Request, Response, NextFunction } from 'express';
import * as reminderService from '../services/reminder.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/reminders/upcoming?days=7
 * Lists open tasks due soon + unread reminder notifications.
 */
export const listUpcoming = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const days = req.query.days ? Number(req.query.days) : 7;
    const reminders = await reminderService.listUpcomingReminders(userId, days);
    sendSuccess(res, reminders, 'Upcoming reminders retrieved successfully');
  } catch (error) {
    next(error);
  }
};
