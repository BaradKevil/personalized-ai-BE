/**
 * ===========================================
 *  Stats Controller
 * ===========================================
 *
 * Handles HTTP request/response for the productivity
 * overview. Thin controller — logic lives in the service.
 */

import { Request, Response, NextFunction } from 'express';
import * as statsService from '../services/stats.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/stats/overview
 * Returns the authenticated user's productivity overview.
 */
export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const overview = await statsService.getStatsOverview(userId);
    sendSuccess(res, overview, 'Stats retrieved successfully');
  } catch (error) {
    next(error);
  }
};
