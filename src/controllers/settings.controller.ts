/**
 * ===========================================
 *  Settings Controller
 * ===========================================
 *
 * Handles HTTP request/response for user preferences
 * (settings). Delegates business logic to the
 * settings service layer.
 */

import { Request, Response, NextFunction } from 'express';
import * as settingsService from '../services/settings.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/settings
 *
 * Returns the authenticated user's preferences.
 */
export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const settings = await settingsService.getSettingsByUserId(userId);
    sendSuccess(res, settings, 'Settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings
 *
 * Partially updates the authenticated user's preferences.
 */
export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const settings = await settingsService.updateSettingsByUserId(userId, req.body);
    sendSuccess(res, settings, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
};
