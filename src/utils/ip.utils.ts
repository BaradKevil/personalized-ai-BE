/**
 * ===========================================
 *  IP Address Utility
 * ===========================================
 *
 * Helper functions for parsing and normalizing client IP addresses.
 */

import { Request } from 'express';

/**
 * Extracts and normalizes client IP address from Express Request.
 * Maps IPv6 loopback (::1, ::ffff:127.0.0.1) to 127.0.0.1 for local dev,
 * strips ::ffff: prefix from IPv4-mapped IPv6 addresses,
 * and parses X-Forwarded-For header for reverse proxies (Nginx, Cloudflare, etc.).
 *
 * @param req - Express Request object
 * @returns Clean IP address string
 */
export const getCleanIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  let rawIp = '';

  if (typeof forwarded === 'string') {
    rawIp = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    rawIp = forwarded[0].trim();
  } else {
    rawIp = req.ip || req.socket.remoteAddress || '';
  }

  // Normalize IPv6 loopback to IPv4 127.0.0.1
  if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }

  // Strip IPv6-mapped IPv4 prefix (e.g., ::ffff:192.168.1.1 -> 192.168.1.1)
  if (rawIp.startsWith('::ffff:')) {
    return rawIp.replace('::ffff:', '');
  }

  return rawIp || '127.0.0.1';
};
