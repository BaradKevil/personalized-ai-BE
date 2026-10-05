/**
 * ===========================================
 *  Progress Service
 * ===========================================
 *
 * Aggregates the user's progress across goals, weekly task
 * completion, and habit streaks into one view. All numbers
 * come from the user's own records.
 */

import { Op } from 'sequelize';
import { Goal, Habit, HabitLog, Task } from '../models';
import { getStatsOverview } from './stats.service';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

export interface ProgressOverview {
  goals: {
    total: number;
    completed: number;
    inProgress: number;
    avgProgress: number;
    list: {
      id: number;
      title: string;
      progress: number;
      status: string;
    }[];
  };
  tasks: {
    completedThisWeek: number;
    completionRate: number;
    streak: number;
    open: number;
  };
  habits: {
    total: number;
    bestStreak: number;
    completedToday: number;
    thisWeek: number;
  };
}

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Builds the full progress overview for the authenticated user.
 */
export const getProgressOverview = async (userId: number): Promise<ProgressOverview> => {
  const [goals, tasks, habits, habitLogs, stats] = await Promise.all([
    Goal.findAll({ where: { user_id: userId } }),
    Task.findAll({ where: { user_id: userId } }),
    Habit.findAll({ where: { user_id: userId } }),
    habitLogsFor(userId),
    getStatsOverview(userId),
  ]);

  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const inProgress = goals.filter((g) => g.status === 'active').length;
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  const todayIso = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const logsForHabits = groupLogs(habitLogs);
  const bestStreak = habits.reduce((max, habit) => {
    const streak = computeHabitStreak(logsForHabits.get(habit.id) ?? []);
    return Math.max(max, streak);
  }, 0);

  const completedToday = habitLogs.filter((l) => l.log_date === todayIso).length;
  const thisWeek = habitLogs.filter((l) => new Date(l.log_date) >= weekAgo).length;

  return {
    goals: {
      total: goals.length,
      completed: completedGoals,
      inProgress,
      avgProgress,
      list: goals.map((g) => ({
        id: g.id,
        title: g.title,
        progress: g.progress,
        status: g.status,
      })),
    },
    tasks: {
      completedThisWeek: stats.completedThisWeek,
      completionRate: stats.completionRate,
      streak: stats.streak,
      open: stats.open,
    },
    habits: {
      total: habits.length,
      bestStreak,
      completedToday,
      thisWeek,
    },
  };
};

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

const habitLogsFor = async (userId: number): Promise<HabitLog[]> => {
  const habits = await Habit.findAll({ where: { user_id: userId } });
  if (habits.length === 0) return [];
  return HabitLog.findAll({
    where: { habit_id: { [Op.in]: habits.map((h) => h.id) } },
  });
};

const groupLogs = (logs: HabitLog[]): Map<number, string[]> => {
  const map = new Map<number, string[]>();
  for (const log of logs) {
    const list = map.get(log.habit_id) ?? [];
    list.push(log.log_date);
    map.set(log.habit_id, list);
  }
  return map;
};

const computeHabitStreak = (logDates: string[]): number => {
  const set = new Set(logDates);
  const cursor = new Date();
  const iso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (!set.has(iso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (set.has(iso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
