/**
 * ===========================================
 *  Stats Service
 * ===========================================
 *
 * Deterministic productivity analytics — no AI involved.
 * Aggregates the authenticated user's own records into a
 * compact overview used by the Today dashboard.
 *
 * Everything is scoped to the user's ID (never another user's).
 */

import { Op } from 'sequelize';
import {
  Conversation,
  Goal,
  Memory,
  Notification,
  Task,
} from '../models';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** One bar of the 7-day completion chart */
export interface DayCount {
  /** ISO date key, e.g. "2026-08-15" */
  day: string;
  count: number;
}

/** Compact productivity overview for the dashboard */
export interface StatsOverview {
  week: DayCount[];
  completedToday: number;
  completedThisWeek: number;
  completionRate: number;
  streak: number;
  open: number;
  overdue: number;
  highPriorityOpen: number;
  goals: {
    total: number;
    inProgress: number;
    completed: number;
  };
  memories: number;
  conversations: number;
  unreadNotifications: number;
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

/** Builds the last 7 day keys (oldest → newest), ending today. */
const lastSevenDayKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(isoDay(d));
  }
  return keys;
};

/** Computes the current completion streak (consecutive days with ≥1 completion). */
const computeStreak = (completedAt: Date[]): number => {
  if (completedAt.length === 0) return 0;

  const days = new Set(completedAt.map((d) => isoDay(new Date(d))));

  // A streak counts from today, or from yesterday if today has none yet.
  let cursor = new Date();
  if (!days.has(isoDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(isoDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

// -------------------------------------------------
//  Service Method
// -------------------------------------------------

/**
 * Builds the productivity overview for a user.
 */
export const getStatsOverview = async (userId: number): Promise<StatsOverview> => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // --- Tasks --------------------------------------------------------
  const tasks = await Task.findAll({ where: { user_id: userId } });

  const completed = tasks.filter((t) => t.status === 'completed');
  const open = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const overdue = open.filter((t) => t.due_at && new Date(t.due_at) < now);
  const highPriorityOpen = open.filter((t) => t.priority === 'high');

  const completedAt = completed
    .map((t) => t.completed_at || t.updated_at)
    .filter((d): d is Date => Boolean(d));

  const weekCounts = new Map<string, number>();
  for (const key of lastSevenDayKeys()) weekCounts.set(key, 0);
  for (const date of completedAt) {
    const key = isoDay(new Date(date));
    if (weekCounts.has(key)) weekCounts.set(key, weekCounts.get(key)! + 1);
  }

  const completedToday = completedAt.filter((d) => new Date(d) >= todayStart).length;
  const completedThisWeek = completedAt.filter((d) => new Date(d) >= weekStart).length;
  const completionRate =
    tasks.length === 0
      ? 0
      : Math.round((completed.length / tasks.length) * 100);

  // --- Goals --------------------------------------------------------
  const goals = await Goal.findAll({ where: { user_id: userId } });
  const goalsCompleted = goals.filter((g) => g.status === 'completed').length;
  const goalsInProgress = goals.filter((g) => g.status === 'active').length;

  // --- Other counts -------------------------------------------------
  const [memories, conversations, unreadNotifications] = await Promise.all([
    Memory.count({ where: { user_id: userId } }),
    Conversation.count({ where: { user_id: userId } }),
    Notification.count({ where: { user_id: userId, read_at: null } }),
  ]);

  return {
    week: [...weekCounts.entries()].map(([day, count]) => ({ day, count })),
    completedToday,
    completedThisWeek,
    completionRate,
    streak: computeStreak(completedAt),
    open: open.length,
    overdue: overdue.length,
    highPriorityOpen: highPriorityOpen.length,
    goals: {
      total: goals.length,
      inProgress: goalsInProgress,
      completed: goalsCompleted,
    },
    memories,
    conversations,
    unreadNotifications,
  };
};
