/**
 * ===========================================
 *  Daily Briefing Controller
 * ===========================================
 *
 * Handles the daily briefing endpoint. Delegates to
 * the briefing service (deterministic-first).
 */

import { Request, Response, NextFunction } from 'express';
import * as dailyBriefingService from '../services/daily-briefing.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/daily-briefing
 * Returns the authenticated user's daily briefing.
 */
export const getDailyBriefing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const briefing = await dailyBriefingService.getDailyBriefing(userId);
    sendSuccess(res, briefing, 'Daily briefing retrieved successfully');
  } catch (error) {
    next(error);
  }
};
