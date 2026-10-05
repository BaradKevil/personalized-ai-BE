/**
 * ===========================================
 *  Activity Log Controller
 * ===========================================
 *
 * Handles HTTP request/response for the user's own
 * activity logs (paginated). Requires authentication.
 */

import { Request, Response, NextFunction } from 'express';
import * as activityLogService from '../services/activity-log.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/activity-logs
 * Lists the authenticated user's activity logs.
 * Query params: ?page=1&limit=20
 */
export const listActivityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await activityLogService.listLogsByUser(userId, page, limit);
    sendSuccess(res, result, 'Activity logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};
