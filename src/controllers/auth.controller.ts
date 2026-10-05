/**
 * ===========================================
 *  Authentication Controller
 * ===========================================
 *
 * Handles HTTP request/response for authentication operations:
 * registration, login, token refresh, and logout.
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, getCleanIp } from '../utils';

/**
 * POST /api/auth/register
 *
 * Registers a new user account and provisions the user's
 * personal AI agent + default preferences.
 * Expects: { name, mobile, email, password, timezone }
 * Returns: User + agent data + token pair (201 Created).
 */
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ipAddress = getCleanIp(req);
    const result = await authService.register({ ...req.body, ip_address: ipAddress });
    sendSuccess(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email (or mobile number) and password.
 * Expects: { identifier, password }
 * Returns: User + agent data + token pair (200 OK).
 */
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ipAddress = getCleanIp(req);
    const result = await authService.login({ ...req.body, ip_address: ipAddress });
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh-token
 *
 * Refreshes access token using a valid refresh token.
 * Expects: { refresh_token }
 * Returns: New access and refresh token pair (200 OK).
 */
export const refreshTokens = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ipAddress = getCleanIp(req);
    const result = await authService.refreshToken(req.body.refresh_token, ipAddress);
    sendSuccess(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/change-password
 *
 * Changes the authenticated user's password.
 * Expects: { current_password, new_password }
 * Returns: Success message (200 OK).
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ipAddress = getCleanIp(req);
    await authService.changePassword(
      req.user!.id,
      req.body.current_password,
      req.body.new_password,
      ipAddress
    );
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 *
 * Logs out the user by revoking their refresh token.
 * Expects: { refresh_token } (optional)
 * Returns: Success message (200 OK).
 */
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ipAddress = getCleanIp(req);
    await authService.logout(req.body.refresh_token, ipAddress);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
