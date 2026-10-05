/**
 * ===========================================
 *  Task Service
 * ===========================================
 *
 * Business logic for tasks. Tasks belong to the owning
 * user — ownership is enforced in every operation.
 */

import { Transaction } from 'sequelize';
import { Task, sequelize } from '../models';
import { TaskPriority, TaskStatus } from '../models/task.model';
import { AppError } from '../middlewares/error.middleware';
import { toTaskPayload } from '../utils/serializers';
import { logActivity } from './activity-log.service';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for creating a task (camelCase API contract) */
export interface CreateTaskInput {
  title: string;
  notes?: string;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
  recurrence?: string;
  tags?: string[];
}

/** Input for updating a task */
export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
  recurrence?: string;
  tags?: string[];
}

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

/**
 * Loads a task only if it belongs to the given user.
 * Throws 404 otherwise — never leaks another user's task.
 */
const findOwnedTask = async (
  taskId: number,
  userId: number,
  transaction?: Transaction
): Promise<Task> => {
  const task = await Task.findOne({
    where: { id: taskId, user_id: userId },
    transaction,
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return task;
};

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Lists the user's tasks, sorted by status (open first),
 * then priority, then due date.
 */
export const listTasksByUser = async (
  userId: number
): Promise<ReturnType<typeof toTaskPayload>[]> => {
  const tasks = await Task.findAll({
    where: { user_id: userId },
    order: [
      ['status', 'ASC'],
      ['due_at', 'ASC'],
    ],
  });

  return tasks.map(toTaskPayload);
};

/**
 * Creates a task for the user.
 */
export const createTaskForUser = async (
  userId: number,
  input: CreateTaskInput
): Promise<ReturnType<typeof toTaskPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const task = await Task.create(
      {
        user_id: userId,
        title: input.title,
        notes: input.notes ?? null,
        priority: input.priority ?? 'medium',
        due_at: input.dueDate ? new Date(input.dueDate) : null,
        recurrence: input.recurrence ?? 'none',
        tags: input.tags ?? [],
      },
      { transaction }
    );

    await logActivity({
      userId,
      actionPerformed: 'TASK_CREATED',
      description: `Task created: '${input.title}'`,
      transaction,
    });

    return toTaskPayload(task);
  });
};

/**
 * Updates a task owned by the user.
 */
export const updateTaskForUser = async (
  taskId: number,
  userId: number,
  input: UpdateTaskInput
): Promise<ReturnType<typeof toTaskPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const task = await findOwnedTask(taskId, userId, transaction);

    await task.update(
      {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.dueDate !== undefined && { due_at: input.dueDate ? new Date(input.dueDate) : null }),
        ...(input.recurrence !== undefined && { recurrence: input.recurrence }),
        ...(input.tags !== undefined && { tags: input.tags }),
      },
      { transaction }
    );

    return toTaskPayload(task);
  });
};

/**
 * Toggles a task's completion state.
 * Completing sets completed_at; reopening clears it.
 */
export const toggleTaskForUser = async (
  taskId: number,
  userId: number
): Promise<ReturnType<typeof toTaskPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const task = await findOwnedTask(taskId, userId, transaction);

    const nowCompleted = task.status !== 'completed';

    await task.update(
      {
        status: (nowCompleted ? 'completed' : 'pending') as TaskStatus,
        completed_at: nowCompleted ? new Date() : null,
      },
      { transaction }
    );

    await logActivity({
      userId,
      actionPerformed: nowCompleted ? 'TASK_COMPLETED' : 'TASK_REOPENED',
      description: nowCompleted
        ? `Task completed: '${task.title}'`
        : `Task reopened: '${task.title}'`,
      transaction,
    });

    return toTaskPayload(task);
  });
};

/**
 * Deletes a task owned by the user.
 */
export const deleteTaskForUser = async (
  taskId: number,
  userId: number
): Promise<void> => {
  return sequelize.transaction(async (transaction) => {
    const task = await findOwnedTask(taskId, userId, transaction);

    await task.destroy({ transaction });

    await logActivity({
      userId,
      actionPerformed: 'TASK_DELETED',
      description: `Task deleted: '${task.title}'`,
      transaction,
    });
  });
};
