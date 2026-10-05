/**
 * ===========================================
 *  Calendar Controller
 * ===========================================
 */

import { Request, Response, NextFunction } from 'express';
import * as calendarService from '../services/calendar.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/calendar/events?month=YYYY-MM
 * Lists the user's dated tasks and goals for a month.
 */
export const listMonthEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    const events = await calendarService.listMonthEvents(userId, month);
    sendSuccess(res, events, 'Calendar events retrieved successfully');
  } catch (error) {
    next(error);
  }
};
