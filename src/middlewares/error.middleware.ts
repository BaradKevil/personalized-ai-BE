/**
 * ===========================================
 *  Error Handling Middleware & AppError Class
 * ===========================================
 *
 * Provides a custom error class (AppError) for
 * throwing operational errors with HTTP status codes,
 * and a global Express error handler that catches
 * all errors and returns a standardized JSON response.
 *
 * Raw database/provider errors are NEVER returned to
 * the client — they are mapped to safe user messages
 * and logged with technical detail server-side.
 */

import { Request, Response, NextFunction } from 'express';
import {
  ConnectionError,
  ConnectionRefusedError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError as SequelizeValidationError,
} from 'sequelize';

// -------------------------------------------------
//  Custom Error Class
// -------------------------------------------------

/**
 * AppError — Custom error class for operational errors.
 *
 * Extends the native Error class with an HTTP statusCode.
 * Use this to throw predictable errors from services
 * and controllers that will be caught by the global
 * error handler.
 *
 * @example
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Unauthorized access', 401);
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational errors from programming bugs

    // Captures a clean stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

// -------------------------------------------------
//  Sequelize Error Mapping
// -------------------------------------------------

/**
 * Maps common Sequelize errors to user-safe AppError instances.
 * Technical detail is preserved for server-side logging.
 */
const mapDatabaseError = (err: Error): AppError => {
  if (err instanceof UniqueConstraintError) {
    return new AppError('A record with those details already exists', 409);
  }
  if (err instanceof ForeignKeyConstraintError) {
    return new AppError('The referenced record does not exist', 400);
  }
  if (err instanceof SequelizeValidationError) {
    const first = err.errors?.[0]?.message;
    return new AppError(first || 'Invalid data provided', 400);
  }
  if (err instanceof ConnectionError || err instanceof ConnectionRefusedError) {
    return new AppError('Database temporarily unavailable. Please try again.', 503);
  }
  return new AppError('Internal Server Error', 500);
};

// -------------------------------------------------
//  Global Error Handler Middleware
// -------------------------------------------------

/**
 * Express error-handling middleware.
 *
 * Catches all errors passed via next(error) and returns
 * a consistent JSON error response:
 *  - Operational errors (AppError) — the specified status code
 *  - Sequelize errors — mapped to safe user messages
 *  - Unexpected errors — 500 Internal Server Error
 *
 * Console logging is deliberately calm: expected errors log
 * one line; unexpected errors log the full stack for diagnosis.
 * In development mode the stack is included in the response.
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isAppError = err instanceof AppError;

  // Map raw database errors to safe user-facing errors
  const mapped = isAppError ? (err as AppError) : mapDatabaseError(err);

  const statusCode = mapped.statusCode;
  const message = mapped.message;

  // Calm, consistent logging — never dump raw DB/provider internals as noise
  if (isAppError) {
    console.error(`❌ [Error] ${statusCode} - ${message}`);
  } else {
    console.error(`\n❌ [Error] ${statusCode} - ${message}`);
    console.error(`   ${err.constructor.name}: ${err.message}`);
    console.error(err.stack);
  }

  // Send structured JSON error response
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
