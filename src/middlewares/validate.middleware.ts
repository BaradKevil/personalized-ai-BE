/**
 * ===========================================
 *  Request Validation Middleware
 * ===========================================
 *
 * Generic validation middleware factory using Joi.
 * Creates Express middleware that validates request
 * data (body, query, or params) against a Joi schema.
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './error.middleware';

// -------------------------------------------------
//  Validation Source Type
// -------------------------------------------------

/** Which part of the request to validate */
type ValidationSource = 'body' | 'query' | 'params';

// -------------------------------------------------
//  Middleware Factory
// -------------------------------------------------

/**
 * Creates a validation middleware for the given Joi schema.
 *
 * @param schema - Joi object schema to validate against
 * @param source - Which part of the request to validate (default: 'body')
 * @returns Express middleware function
 *
 * @example
 *   // In route definition:
 *   router.post('/register', validate(registerSchema), registerUser);
 *   router.get('/search', validate(searchSchema, 'query'), searchHandler);
 */
export const validate = (
  schema: Joi.ObjectSchema,
  source: ValidationSource = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Validate the specified request source against the schema
    const { error, value } = schema.validate(req[source], {
      abortEarly: true,    // Stop at the first validation error
      stripUnknown: true,  // Remove unknown fields for security
    });

    if (error) {
      // Return only the first validation error message
      const errorMessage = error.details[0].message;

      throw new AppError(errorMessage, 400);
    }

    // Replace the request source with the validated (and sanitized) value
    req[source] = value;
    next();
  };
};
