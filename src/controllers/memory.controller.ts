/**
 * ===========================================
 *  Memory Controller
 * ===========================================
 *
 * Handles HTTP request/response for memory operations.
 * All routes require authentication; ownership is
 * enforced in the service layer.
 */

import { Request, Response, NextFunction } from 'express';
import * as memoryService from '../services/memory.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/memory
 * Lists the user's memories. Optional ?search= free-text filter.
 */
export const listMemories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const memories = await memoryService.listMemoriesByUser(userId, search);
    sendSuccess(res, memories, 'Memories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/memory
 * Creates a memory. Expects: { category?, content, importance? }
 */
export const createMemory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const memory = await memoryService.createMemoryForUser(userId, req.body);
    sendSuccess(res, memory, 'Memory saved successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/memory/:id
 * Updates a memory owned by the user.
 */
export const updateMemory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const memoryId = Number(req.params.id);
    const memory = await memoryService.updateMemoryForUser(memoryId, userId, req.body);
    sendSuccess(res, memory, 'Memory updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/memory/:id
 * Forgets a memory owned by the user.
 */
export const deleteMemory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const memoryId = Number(req.params.id);
    await memoryService.deleteMemoryForUser(memoryId, userId);
    sendSuccess(res, null, 'Memory forgotten successfully');
  } catch (error) {
    next(error);
  }
};
