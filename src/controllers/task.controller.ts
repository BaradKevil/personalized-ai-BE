/**
 * ===========================================
 *  Task Controller
 * ===========================================
 *
 * Handles HTTP request/response for task operations.
 * All routes require authentication; ownership is
 * enforced in the service layer.
 */

import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';
import { sendSuccess } from '../utils/response.handler';

/**
 * GET /api/tasks
 * Lists the authenticated user's tasks.
 */
export const listTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tasks = await taskService.listTasksByUser(userId);
    sendSuccess(res, tasks, 'Tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks
 * Creates a task. Expects: { title, notes?, priority?, dueDate?, recurrence?, tags? }
 */
export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const task = await taskService.createTaskForUser(userId, req.body);
    sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tasks/:id
 * Updates a task owned by the user.
 */
export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = Number(req.params.id);
    const task = await taskService.updateTaskForUser(taskId, userId, req.body);
    sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks/:id/toggle
 * Toggles a task's completion state.
 */
export const toggleTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = Number(req.params.id);
    const task = await taskService.toggleTaskForUser(taskId, userId);
    sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:id
 * Deletes a task owned by the user.
 */
export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = Number(req.params.id);
    await taskService.deleteTaskForUser(taskId, userId);
    sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};
