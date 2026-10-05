/**
 * ===========================================
 *  Authentication Middleware
 * ===========================================
 *
 * Provides middleware functions for JWT-based
 * authentication:
 *  - verifyToken:  Requires a valid token (rejects if absent/invalid)
 *  - decodeToken:  Optionally decodes token (does not reject if absent)
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken as verifyJwt } from '../utils/token.utils';
import { AppError } from './error.middleware';

// -------------------------------------------------
//  Type Augmentation
// -------------------------------------------------

/**
 * Extends the Express Request interface to include
 * a `user` property populated by auth middleware.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

// -------------------------------------------------
//  Middleware: Verify Token (Required)
// -------------------------------------------------

/**
 * Verifies the JWT token from the Authorization header.
 *
 * Expected header format: "Bearer <token>"
 *
 * On success: Decodes the token and attaches the payload
 *             to req.user, then calls next().
 * On failure: Throws an AppError (401 Unauthorized).
 *
 * Use this middleware on routes that require authentication.
 */
export const verifyToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Extract the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Verify and decode the token
    const decoded = verifyJwt(token);
    req.user = decoded as { id: number; email: string };

    next();
  } catch (error) {
    // If token verification fails, return 401
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};

// -------------------------------------------------
//  Middleware: Decode Token (Optional)
// -------------------------------------------------

/**
 * Optionally decodes the JWT token if present.
 *
 * Unlike verifyToken, this middleware does NOT reject
 * the request if no token is provided. It simply
 * attaches the decoded payload to req.user if a valid
 * token exists.
 *
 * Use this on routes where authentication is optional
 * but user context is helpful (e.g., personalized content).
 */
export const decodeToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyJwt(token);
      req.user = decoded as { id: number; email: string };
    }
  } catch {
    // Silently ignore token errors — user remains unauthenticated
  }

  next();
};
