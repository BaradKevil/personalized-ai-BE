/**
 * ===========================================
 *  Goal Controller
 * ===========================================
 *
 * Handles HTTP request/response for goal operations.
 * All routes require authentication; ownership is
 * enforced in the service layer.
 */

import { Request, Response, NextFunction } from 'express';
import * as goalService from '../services/goal.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/goals
 * Lists the authenticated user's goals.
 */
export const listGoals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goals = await goalService.listGoalsByUser(userId);
    sendSuccess(res, goals, 'Goals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/goals
 * Creates a goal. Expects: { title, description?, targetDate?, steps? }
 */
export const createGoal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goal = await goalService.createGoalForUser(userId, req.body);
    sendSuccess(res, goal, 'Goal created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/goals/:id
 * Updates a goal owned by the user.
 */
export const updateGoal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goalId = Number(req.params.id);
    const goal = await goalService.updateGoalForUser(goalId, userId, req.body);
    sendSuccess(res, goal, 'Goal updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/goals/:goalId/steps/:stepId/toggle
 * Toggles a goal step's done state.
 */
export const toggleGoalStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goalId = Number(req.params.goalId);
    const stepId = req.params.stepId;
    const goal = await goalService.toggleGoalStepForUser(goalId, userId, stepId);
    sendSuccess(res, goal, 'Goal step updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/goals/:id
 * Deletes a goal owned by the user.
 */
export const deleteGoal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goalId = Number(req.params.id);
    await goalService.deleteGoalForUser(goalId, userId);
    sendSuccess(res, null, 'Goal deleted successfully');
  } catch (error) {
    next(error);
  }
};
