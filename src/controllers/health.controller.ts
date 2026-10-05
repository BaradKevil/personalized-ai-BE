/**
 * ===========================================
 *  Health Check Controller
 * ===========================================
 *
 * Handles the health check endpoint logic.
 * Returns server status information.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.handler';
import sequelize from '../../config/database';

/**
 * GET /api/health
 *
 * Returns a health status object containing:
 *  - status: 'OK' or 'DEGRADED'
 *  - database: 'connected' or 'disconnected'
 *  - uptime: Server uptime in seconds
 *  - timestamp: Current ISO timestamp
 */
export const getHealthStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let dbStatus = 'connected';
    try {
      await sequelize.authenticate();
    } catch {
      dbStatus = 'disconnected';
    }

    sendSuccess(
      res,
      {
        status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
        database: dbStatus,
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString(),
      },
      dbStatus === 'connected' ? 'Server is healthy' : 'Server is degraded (database unavailable)',
      dbStatus === 'connected' ? 200 : 503
    );
  } catch (error) {
    next(error);
  }
};

