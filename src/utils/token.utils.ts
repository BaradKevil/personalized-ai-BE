/**
 * ===========================================
 *  JWT Token Utilities
 * ===========================================
 *
 * Helper functions for generating and verifying
 * JSON Web Tokens (Access and Refresh tokens).
 */

import jwt from 'jsonwebtoken';
import config from '../../config';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Payload encoded inside the JWT */
export interface TokenPayload {
  id: number;
  email: string;
}

// -------------------------------------------------
//  Token Generation
// -------------------------------------------------

/**
 * Generates an Access Token (short-lived).
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
};

/**
 * Generates a Refresh Token (long-lived).
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

// -------------------------------------------------
//  Token Verification
// -------------------------------------------------

/**
 * Legacy/Default token generator (uses access token logic).
 */
export const generateToken = (payload: TokenPayload): string => {
  return generateAccessToken(payload);
};

/**
 * Verifies an Access Token.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
};

/**
 * Verifies a Refresh Token.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
};

/**
 * Legacy/Default token verification (uses access token secret).
 */
export const verifyToken = (token: string): TokenPayload => {
  return verifyAccessToken(token);
};

// -------------------------------------------------
//  Helper Utilities
// -------------------------------------------------

/**
 * Parses an expiry duration string (e.g. '7d', '15m', '1h') into a future Date object.
 *
 * @param expiryStr - Duration string (e.g., '7d', '15m', '2h')
 * @returns Date object in the future
 */
export const parseExpiryToDate = (expiryStr: string): Date => {
  const match = expiryStr.match(/^(\d+)([smhd])$/);
  const now = new Date();

  if (!match) {
    // Default fallback to 7 days if unparseable
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2];
  let ms = 0;

  switch (unit) {
    case 's': ms = amount * 1000; break;
    case 'm': ms = amount * 60 * 1000; break;
    case 'h': ms = amount * 60 * 60 * 1000; break;
    case 'd': ms = amount * 24 * 60 * 60 * 1000; break;
  }

  return new Date(now.getTime() + ms);
};
