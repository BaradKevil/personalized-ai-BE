/**
 * ===========================================
 *  User Controller
 * ===========================================
 *
 * Handles HTTP request/response for user-related
 * operations. Delegates business logic to the
 * user service layer.
 */

import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess, getCleanIp } from '../utils';

/**
 * GET /api/users/profile
 *
 * Returns the authenticated user's profile data.
 * The user ID is extracted from the JWT token
 * (set by auth middleware on req.user).
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // req.user is populated by the verifyToken middleware
    const userId = req.user!.id;
    const profile = await userService.getUserProfile(userId);
    sendSuccess(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    next(error); // Forward to global error handler
  }
};

/**
 * PUT /api/users/profile
 *
 * Updates the authenticated user's profile.
 * The user ID is taken from the token, never from the body.
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await userService.updateUserProfile(userId, req.body);
    sendSuccess(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me
 *
 * Permanently deletes the authenticated user's account
 * after verifying their password. All owned data is
 * removed by the database cascade.
 */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const ipAddress = getCleanIp(req);
    await userService.deleteAccount(userId, req.body.password, ipAddress);
    sendSuccess(res, null, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};
