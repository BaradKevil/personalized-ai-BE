/**
 * ===========================================
 *  Insight Controller
 * ===========================================
 */

import { Request, Response, NextFunction } from 'express';
import * as insightService from '../services/insight.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/insights
 * Returns data-backed insights for the authenticated user.
 */
export const listInsights = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const insights = await insightService.buildInsights(userId);
    sendSuccess(res, insights, 'Insights retrieved successfully');
  } catch (error) {
    next(error);
  }
};
