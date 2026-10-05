/**
 * ===========================================
 *  Rate Limiting Middleware
 * ===========================================
 *
 * Protects authentication and AI endpoints against
 * brute-force and quota abuse. Limits are configurable
 * via environment variables and disabled in test mode.
 */

import rateLimit from 'express-rate-limit';
import config from '../../config';

/** Whether rate limiting is disabled (test environments) */
const disabled = config.nodeEnv === 'test';

/**
 * Generic limiter factory.
 *
 * @param windowMs - Time window in milliseconds
 * @param limit - Maximum number of requests per window
 * @param message - Human-readable message returned when the limit is hit
 */
const createLimiter = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,   // Return RateLimit-* headers
    legacyHeaders: false,    // Disable X-RateLimit-* headers
    skip: () => disabled,
    message: {
      success: false,
      statusCode: 429,
      message,
    },
  });

/**
 * Protects login, registration, and refresh endpoints.
 * Default: 30 requests per 15 minutes per IP — generous enough
 * for local development and the smoke suite, still brute-force safe.
 */
export const authLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  'Too many authentication attempts. Please try again later.'
);

/**
 * Protects AI / chat endpoints because they consume provider quota.
 * Default: 30 requests per minute per IP.
 */
export const aiLimiter = createLimiter(
  60 * 1000,
  30,
  'Too many AI requests. Please slow down and try again.'
);

/**
 * Generic limiter for other expensive or write-heavy endpoints.
 * Default: 100 requests per minute per IP.
 */
export const apiLimiter = createLimiter(
  60 * 1000,
  100,
  'Too many requests. Please try again later.'
);
