/**
 * ===========================================
 *  Insight Service
 * ===========================================
 *
 * Composes deterministic, data-backed insights about the
 * user's own activity — no AI, no fabrication. Every insight
 * is computed from real records and leads to a suggested action.
 * Insights with no underlying data are simply skipped.
 */

import { Op } from 'sequelize';
import { Goal, Habit, HabitLog, Memory, Task } from '../models';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

export interface Insight {
  id: string;
  kind: 'win' | 'notice' | 'warning' | 'suggestion';
  title: string;
  message: string;
  suggestion: string;
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

const lastNDayKeys = (n: number): string[] => {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(isoDay(d));
  }
  return keys;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Builds the user's insights. Each insight is only included
 * when there is real data behind it.
 */
export const buildInsights = async (userId: number): Promise<Insight[]> => {
  const insights: Insight[] = [];

  const [tasks, goals, memories, habits] = await Promise.all([
    Task.findAll({ where: { user_id: userId } }),
    Goal.findAll({ where: { user_id: userId } }),
    Memory.findAll({ where: { user_id: userId } }),
    Habit.findAll({ where: { user_id: userId } }),
  ]);

  // Habit logs are only queried when the user has habits
  let logs: HabitLog[] = [];
  if (habits.length > 0) {
    logs = await HabitLog.findAll({
      where: { habit_id: { [Op.in]: habits.map((h) => h.id) } },
    });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const completed = tasks.filter((t) => t.status === 'completed' && t.completed_at);
  const completedAt = completed.map((t) => new Date(t.completed_at as Date));
  const open = tasks.filter((t) => t.status !== 'completed');
  const overdue = open.filter((t) => t.due_at && new Date(t.due_at) < startOfToday);
  const highPriorityOpen = open.filter((t) => t.priority === 'high');

  // --- Insight: completion win (this week) ---
  const weekKeys = lastNDayKeys(7);
  const weekSet = new Set(weekKeys);
  const completedThisWeek = completedAt.filter((d) => weekSet.has(isoDay(d))).length;
  if (completedThisWeek >= 3) {
    insights.push({
      id: 'week-win',
      kind: 'win',
      title: 'You completed work this week',
      message: `${completedThisWeek} task${completedThisWeek > 1 ? 's' : ''} done in the last 7 days.`,
      suggestion: completedThisWeek >= 5
        ? 'Protect the same hours tomorrow — your rhythm is working.'
        : 'Try to finish two more before the week ends to keep the streak alive.',
    });
  }

  // --- Insight: best day of the week ---
  if (completedAt.length >= 3) {
    const counts = new Array(7).fill(0);
    for (const d of completedAt) counts[d.getDay()] += 1;
    const best = counts.indexOf(Math.max(...counts));
    if (counts[best] >= 2) {
      insights.push({
        id: 'best-day',
        kind: 'notice',
        title: 'Your strongest day',
        message: `You finish the most tasks on ${DAY_NAMES[best]} (${counts[best]} this period).`,
        suggestion: `Schedule your hardest work on ${DAY_NAMES[best]}s going forward.`,
      });
    }
  }

  // --- Insight: overdue tasks ---
  if (overdue.length > 0) {
    insights.push({
      id: 'overdue',
      kind: 'warning',
      title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      message: overdue
        .slice(0, 3)
        .map((t) => `"${t.title}"`)
        .join(', '),
      suggestion: 'Clear the oldest one first — momentum beats planning here.',
    });
  }

  // --- Insight: high priority focus ---
  if (highPriorityOpen.length > 0) {
    const top = highPriorityOpen[0];
    insights.push({
      id: 'focus',
      kind: 'suggestion',
      title: 'A high-priority item is open',
      message: `"${top.title}" is waiting${top.due_at ? ` (due ${isoDay(new Date(top.due_at))})` : ''}.`,
      suggestion: 'Do this next — it has the biggest impact on your goals.',
    });
  }

  // --- Insight: goal momentum ---
  const activeGoals = goals.filter((g) => g.status === 'active');
  const closeGoals = activeGoals.filter((g) => g.progress >= 60 && g.progress < 100);
  if (closeGoals.length > 0) {
    const g = closeGoals[0];
    insights.push({
      id: 'goal-close',
      kind: 'win',
      title: `"${g.title}" is ${g.progress}% done`,
      message: `You're close to completing this goal.`,
      suggestion: 'Plan the next three steps to cross the finish line.',
    });
  } else if (activeGoals.length === 0 && goals.length === 0) {
    insights.push({
      id: 'goal-start',
      kind: 'suggestion',
      title: 'No goals yet',
      message: 'Goals give Milo a direction to plan around.',
      suggestion: 'Create one — even a small one — and tell me about it in chat.',
    });
  }

  // --- Insight: habit consistency ---
  if (habits.length > 0) {
    const logsByHabit = new Map<number, string[]>();
    for (const log of logs) {
      const list = logsByHabit.get(log.habit_id) ?? [];
      list.push(log.log_date);
      logsByHabit.set(log.habit_id, list);
    }

    const bestHabit = habits
      .map((h) => ({ habit: h, dates: logsByHabit.get(h.id) ?? [] }))
      .sort((a, b) => b.dates.length - a.dates.length)[0];

    if (bestHabit && bestHabit.dates.length >= 2) {
      const last7 = bestHabit.dates.filter((d) => weekSet.has(d)).length;
      insights.push({
        id: 'habit-consistency',
        kind: 'notice',
        title: `Habit momentum: "${bestHabit.habit.name}"`,
        message: `Logged ${last7} of the last 7 days${last7 === 7 ? ' — perfect week!' : '.'}`,
        suggestion: last7 === 7
          ? 'Keep the streak alive — you are on a roll.'
          : 'One more day this week makes it a full week. Log it before bed.',
      });
    }
  }

  // --- Insight: memory base ---
  if (memories.length >= 3) {
    insights.push({
      id: 'memory-base',
      kind: 'notice',
      title: `${memories.length} things Milo knows`,
      message: 'Your personal knowledge base is growing.',
      suggestion: 'Ask Milo "what do you know about me?" to see what it remembers.',
    });
  }

  return insights.slice(0, 6);
};
