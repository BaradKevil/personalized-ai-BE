/**
 * ===========================================
 *  Standardized Response Handler
 * ===========================================
 *
 * Provides utility functions for sending consistent
 * JSON responses across the entire application.
 * Ensures all API responses follow the same envelope format.
 */

import { Response } from 'express';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Standard success response envelope */
interface SuccessResponse {
  success: true;
  message: string;
  data: any;
}

/** Standard error response envelope */
interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
}

// -------------------------------------------------
//  Response Functions
// -------------------------------------------------

/**
 * Sends a standardized success response.
 *
 * @param res        - Express Response object
 * @param data       - Payload to include in the response
 * @param message    - Human-readable success message (default: 'Success')
 * @param statusCode - HTTP status code (default: 200)
 *
 * @example
 *   sendSuccess(res, { id: 1, name: 'Alex' }, 'User created', 201);
 *
 *   // Response:
 *   // { success: true, message: 'User created', data: { id: 1, name: 'Alex' } }
 */
export const sendSuccess = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  const response: SuccessResponse = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(response);
};

/**
 * Sends a standardized error response.
 *
 * @param res        - Express Response object
 * @param message    - Human-readable error message
 * @param statusCode - HTTP status code (default: 500)
 *
 * @example
 *   sendError(res, 'User not found', 404);
 *
 *   // Response:
 *   // { success: false, message: 'User not found', statusCode: 404 }
 */
export const sendError = (
  res: Response,
  message: string = 'Internal Server Error',
  statusCode: number = 500
): void => {
  const response: ErrorResponse = {
    success: false,
    message,
    statusCode,
  };

  res.status(statusCode).json(response);
};
