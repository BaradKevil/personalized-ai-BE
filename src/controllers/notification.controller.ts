/**
 * ===========================================
 *  Notification Controller
 * ===========================================
 *
 * Handles HTTP request/response for notifications.
 * All routes require authentication; ownership is
 * enforced in the service layer.
 */

import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/notifications
 * Lists the authenticated user's notifications.
 */
export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notifications = await notificationService.listNotificationsByUser(userId);
    sendSuccess(res, notifications, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/read-all
 * Marks all of the user's notifications as read.
 */
export const markAllRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notifications = await notificationService.markAllReadByUser(userId);
    sendSuccess(res, notifications, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 * Returns the user's unread notification count.
 */
export const unreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const count = await notificationService.unreadCountByUser(userId);
    sendSuccess(res, { count }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
};
