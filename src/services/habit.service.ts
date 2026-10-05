/**
 * ===========================================
 *  Habit Service
 * ===========================================
 *
 * Business logic for habits and their daily logs.
 * Every habit belongs to exactly one user — ownership
 * is enforced in every operation. Streaks are computed
 * from the user's own logs.
 */

import { Op } from 'sequelize';
import { Habit, HabitLog, sequelize } from '../models';
import { HabitFrequency } from '../models/habit.model';
import { AppError } from '../middlewares/error.middleware';
import { logActivity } from './activity-log.service';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

export interface CreateHabitInput {
  name: string;
  frequency?: HabitFrequency;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateHabitInput {
  name?: string;
  frequency?: HabitFrequency;
  icon?: string | null;
  color?: string | null;
}

/** A habit plus its computed tracking state */
export interface HabitPayload {
  id: number;
  name: string;
  frequency: HabitFrequency;
  icon: string | null;
  color: string | null;
  streak: number;
  totalLogs: number;
  lastLogged: string | null;
  loggedToday: boolean;
  /** The last 7 log dates (YYYY-MM-DD), oldest first — for week strips */
  recentDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

const isoDay = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const todayKey = (): string => isoDay(new Date());

/**
 * Computes the current streak: consecutive days ending today
 * (or yesterday, if today isn't logged yet) with a log entry.
 */
const computeStreak = (logDates: string[]): number => {
  const set = new Set(logDates);
  const cursor = new Date();

  // If today isn't logged yet, allow the streak to continue from yesterday
  if (!set.has(isoDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (set.has(isoDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const toPayload = (habit: Habit, logs: string[]): HabitPayload => {
  const sorted = [...logs].sort();
  const recent = sorted.slice(-7);
  return {
    id: habit.id,
    name: habit.name,
    frequency: habit.frequency,
    icon: habit.icon,
    color: habit.color,
    streak: computeStreak(logs),
    totalLogs: logs.length,
    lastLogged: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    loggedToday: logs.includes(todayKey()),
    recentDates: recent,
    createdAt: habit.created_at,
    updatedAt: habit.updated_at,
  };
};

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Lists the user's habits with computed tracking state.
 */
export const listHabitsByUser = async (userId: number): Promise<HabitPayload[]> => {
  const habits = await Habit.findAll({
    where: { user_id: userId },
    order: [['created_at', 'ASC']],
  });

  if (habits.length === 0) {
    return [];
  }

  const logs = await HabitLog.findAll({
    where: { habit_id: { [Op.in]: habits.map((h) => h.id) } },
  });

  const byHabit = new Map<number, string[]>();
  for (const log of logs) {
    const list = byHabit.get(log.habit_id) ?? [];
    list.push(log.log_date);
    byHabit.set(log.habit_id, list);
  }

  return habits.map((habit) => toPayload(habit, byHabit.get(habit.id) ?? []));
};

/**
 * Creates a habit for the user.
 */
export const createHabitForUser = async (
  userId: number,
  input: CreateHabitInput
): Promise<HabitPayload> => {
  return sequelize.transaction(async (transaction) => {
    const name = input.name.trim();
    if (!name) {
      throw new AppError('Habit name is required', 400);
    }

    const habit = await Habit.create(
      {
        user_id: userId,
        name,
        frequency: input.frequency ?? 'daily',
        icon: input.icon ?? null,
        color: input.color ?? null,
      },
      { transaction }
    );

    await logActivity({
      userId,
      actionPerformed: 'HABIT_CREATED',
      description: `Habit created: '${name}'`,
      transaction,
    });

    return toPayload(habit, []);
  });
};

/**
 * Updates a habit owned by the user.
 */
export const updateHabitForUser = async (
  habitId: number,
  userId: number,
  input: UpdateHabitInput
): Promise<HabitPayload> => {
  return sequelize.transaction(async (transaction) => {
    const habit = await Habit.findOne({ where: { id: habitId, user_id: userId }, transaction });
    if (!habit) {
      throw new AppError('Habit not found', 404);
    }

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) {
        throw new AppError('Habit name cannot be empty', 400);
      }
      habit.name = name;
    }
    if (input.frequency !== undefined) habit.frequency = input.frequency;
    if (input.icon !== undefined) habit.icon = input.icon || null;
    if (input.color !== undefined) habit.color = input.color || null;

    await habit.save({ transaction });

    const logs = await HabitLog.findAll({ where: { habit_id: habit.id }, transaction });
    return toPayload(habit, logs.map((l) => l.log_date));
  });
};

/**
 * Deletes a habit owned by the user (logs cascade).
 */
export const deleteHabitForUser = async (
  habitId: number,
  userId: number
): Promise<void> => {
  return sequelize.transaction(async (transaction) => {
    const habit = await Habit.findOne({ where: { id: habitId, user_id: userId }, transaction });
    if (!habit) {
      throw new AppError('Habit not found', 404);
    }

    await habit.destroy({ transaction });

    await logActivity({
      userId,
      actionPerformed: 'HABIT_DELETED',
      description: `Habit deleted: '${habit.name}'`,
      transaction,
    });
  });
};

/**
 * Toggles today's log for a habit owned by the user.
 * Logging a habit twice in one day un-logs it.
 */
export const toggleHabitLogForUser = async (
  habitId: number,
  userId: number,
  date = todayKey()
): Promise<{ logged: boolean; habit: HabitPayload }> => {
  return sequelize.transaction(async (transaction) => {
    const habit = await Habit.findOne({ where: { id: habitId, user_id: userId }, transaction });
    if (!habit) {
      throw new AppError('Habit not found', 404);
    }

    const existing = await HabitLog.findOne({
      where: { habit_id: habitId, log_date: date },
      transaction,
    });

    if (existing) {
      await existing.destroy({ transaction });
    } else {
      await HabitLog.create({ habit_id: habitId, log_date: date }, { transaction });
    }

    const logs = await HabitLog.findAll({ where: { habit_id: habitId }, transaction });

    await logActivity({
      userId,
      actionPerformed: 'HABIT_LOGGED',
      description: existing
        ? `Habit log removed: '${habit.name}' (${date})`
        : `Habit completed: '${habit.name}' (${date})`,
      transaction,
    });

    return { logged: !existing, habit: toPayload(habit, logs.map((l) => l.log_date)) };
  });
};
