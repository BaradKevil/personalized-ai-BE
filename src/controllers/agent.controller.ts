/**
 * ===========================================
 *  Agent Controller
 * ===========================================
 *
 * Handles HTTP request/response for the user's
 * personal AI agent. Delegates business logic to
 * the agent service layer.
 */

import { Request, Response, NextFunction } from 'express';
import * as agentService from '../services/agent.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/agent
 *
 * Returns the authenticated user's personal AI agent.
 */
export const getAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const agent = await agentService.getAgentByUserId(userId);
    sendSuccess(res, agent, 'Agent retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/agent
 *
 * Updates the authenticated user's personal AI agent
 * (name, avatar, color, personality).
 */
export const updateAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const agent = await agentService.updateAgentByUserId(userId, req.body);
    sendSuccess(res, agent, 'Agent updated successfully');
  } catch (error) {
    next(error);
  }
};
