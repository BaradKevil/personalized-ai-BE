/**
 * ===========================================
 *  Progress Controller
 * ===========================================
 */

import { Request, Response, NextFunction } from 'express';
import * as progressService from '../services/progress.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/progress
 * Returns the user's aggregated progress overview.
 */
export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const overview = await progressService.getProgressOverview(userId);
    sendSuccess(res, overview, 'Progress retrieved successfully');
  } catch (error) {
    next(error);
  }
};
