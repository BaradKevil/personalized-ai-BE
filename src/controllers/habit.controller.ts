/**
 * ===========================================
 *  Habit Controller
 * ===========================================
 *
 * Handles HTTP request/response for habit operations.
 * All routes require authentication; ownership is
 * enforced in the service layer.
 */

import { Request, Response, NextFunction } from 'express';
import * as habitService from '../services/habit.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/habits
 * Lists the authenticated user's habits with tracking state.
 */
export const listHabits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const habits = await habitService.listHabitsByUser(userId);
    sendSuccess(res, habits, 'Habits retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/habits
 * Creates a habit. Expects: { name, frequency?, icon?, color? }
 */
export const createHabit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const habit = await habitService.createHabitForUser(userId, req.body);
    sendSuccess(res, habit, 'Habit created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/habits/:id
 * Updates a habit owned by the user.
 */
export const updateHabit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const habitId = Number(req.params.id);
    const habit = await habitService.updateHabitForUser(habitId, userId, req.body);
    sendSuccess(res, habit, 'Habit updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/habits/:id
 * Deletes a habit owned by the user.
 */
export const deleteHabit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const habitId = Number(req.params.id);
    await habitService.deleteHabitForUser(habitId, userId);
    sendSuccess(res, null, 'Habit deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/habits/:id/toggle
 * Toggles today's completion log for a habit owned by the user.
 * Expects (optional): { date?: "YYYY-MM-DD" }
 */
export const toggleHabitLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const habitId = Number(req.params.id);
    const date = typeof req.body?.date === 'string' ? req.body.date : undefined;
    const result = await habitService.toggleHabitLogForUser(habitId, userId, date);
    sendSuccess(res, result, result.logged ? 'Habit logged successfully' : 'Habit log removed');
  } catch (error) {
    next(error);
  }
};
