/**
 * ===========================================
 *  Goal Service
 * ===========================================
 *
 * Business logic for goals. Goals belong to the owning
 * user — ownership is enforced in every operation.
 * Steps (milestones) live as JSON on the goal row.
 */

import { Transaction } from 'sequelize';
import { Goal, sequelize } from '../models';
import { GoalStep, GoalStatus } from '../models/goal.model';
import { AppError } from '../middlewares/error.middleware';
import { toGoalPayload } from '../utils/serializers';
import { logActivity } from './activity-log.service';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for creating a goal (camelCase API contract) */
export interface CreateGoalInput {
  title: string;
  description?: string;
  targetDate?: string | Date | null;
  steps?: GoalStep[];
}

/** Input for updating a goal */
export interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: GoalStatus;
  targetDate?: string | Date | null;
  steps?: GoalStep[];
}

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

/**
 * Loads a goal only if it belongs to the given user.
 * Throws 404 otherwise — never leaks another user's goal.
 */
const findOwnedGoal = async (
  goalId: number,
  userId: number,
  transaction?: Transaction
): Promise<Goal> => {
  const goal = await Goal.findOne({
    where: { id: goalId, user_id: userId },
    transaction,
  });

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  return goal;
};

/**
 * Recomputes progress (0-100) from the steps array.
 */
const computeProgress = (steps: GoalStep[]): number => {
  if (!steps.length) {
    return 0;
  }
  const done = steps.filter((step) => step.done).length;
  return Math.round((done / steps.length) * 100);
};

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Lists the user's goals, newest first.
 */
export const listGoalsByUser = async (
  userId: number
): Promise<ReturnType<typeof toGoalPayload>[]> => {
  const goals = await Goal.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
  });

  return goals.map(toGoalPayload);
};

/**
 * Creates a goal for the user.
 */
export const createGoalForUser = async (
  userId: number,
  input: CreateGoalInput
): Promise<ReturnType<typeof toGoalPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const steps = input.steps ?? [];

    const goal = await Goal.create(
      {
        user_id: userId,
        title: input.title,
        description: input.description ?? null,
        target_date: input.targetDate ? new Date(input.targetDate) : null,
        steps,
        progress: computeProgress(steps),
      },
      { transaction }
    );

    await logActivity({
      userId,
      actionPerformed: 'GOAL_CREATED',
      description: `Goal created: '${input.title}'`,
      transaction,
    });

    return toGoalPayload(goal);
  });
};

/**
 * Updates a goal owned by the user. When steps change,
 * progress is recomputed.
 */
export const updateGoalForUser = async (
  goalId: number,
  userId: number,
  input: UpdateGoalInput
): Promise<ReturnType<typeof toGoalPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const goal = await findOwnedGoal(goalId, userId, transaction);

    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) patch.status = input.status;
    if (input.targetDate !== undefined) {
      patch.target_date = input.targetDate ? new Date(input.targetDate) : null;
    }
    if (input.steps !== undefined) {
      patch.steps = input.steps;
      patch.progress = computeProgress(input.steps);
    }

    await goal.update(patch, { transaction });

    return toGoalPayload(goal);
  });
};

/**
 * Toggles a goal step's done state. Recomputes progress.
 */
export const toggleGoalStepForUser = async (
  goalId: number,
  userId: number,
  stepId: string
): Promise<ReturnType<typeof toGoalPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const goal = await findOwnedGoal(goalId, userId, transaction);

    const steps: GoalStep[] = Array.isArray(goal.steps) ? [...goal.steps] : [];
    const step = steps.find((s) => s.id === stepId);

    if (!step) {
      throw new AppError('Goal step not found', 404);
    }

    step.done = !step.done;

    await goal.update(
      {
        steps,
        progress: computeProgress(steps),
      },
      { transaction }
    );

    return toGoalPayload(goal);
  });
};

/**
 * Deletes a goal owned by the user.
 */
export const deleteGoalForUser = async (
  goalId: number,
  userId: number
): Promise<void> => {
  return sequelize.transaction(async (transaction) => {
    const goal = await findOwnedGoal(goalId, userId, transaction);

    await goal.destroy({ transaction });

    await logActivity({
      userId,
      actionPerformed: 'GOAL_DELETED',
      description: `Goal deleted: '${goal.title}'`,
      transaction,
    });
  });
};
