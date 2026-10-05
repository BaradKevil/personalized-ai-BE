/**
 * ===========================================
 *  Daily Briefing Service
 * ===========================================
 *
 * Gathers the user's OWN data into a concise briefing:
 * overdue tasks, today's tasks, upcoming tasks, active
 * goals, unread notifications, and top memories.
 *
 * Deterministic backend logic handles the obvious cases
 * (overdue / due today). The AI is only invoked for an
 * optional narrative when Groq is configured — never
 * for the structured summary itself.
 */

import { Op } from 'sequelize';
import { Goal, Memory, Notification, Task, UserPreference } from '../models';
import { getProvider } from '../ai';
import { buildSystemPrompt } from '../ai/prompts';
import config from '../../config';
import { AIProviderError } from '../ai/types';
import { logActivity } from './activity-log.service';

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

/** Start of the user's day (00:00 local) */
const startOfToday = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

/** End of the user's day (23:59:59 local) */
const endOfToday = (): Date => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now;
};

/** 7 days from now */
const inDays = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

// -------------------------------------------------
//  Types
// -------------------------------------------------

/** The daily briefing payload */
interface DailyBriefing {
  date: string;
  summary: {
    overdueCount: number;
    todayCount: number;
    upcomingCount: number;
    activeGoals: number;
    unreadNotifications: number;
  };
  overdueTasks: unknown[];
  todayTasks: unknown[];
  upcomingTasks: unknown[];
  goals: unknown[];
  notifications: unknown[];
  topMemories: unknown[];
  aiNarrative?: string;
}

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Builds the daily briefing for a user.
 *
 * Deterministic summary is always computed. An AI
 * narrative is appended only when Groq is configured
 * and the user has daily briefings enabled.
 */
export const getDailyBriefing = async (
  userId: number
): Promise<DailyBriefing> => {
  const now = new Date();

  // -------------------------------------------------
  //  Deterministic data gathering (user-scoped)
  // -------------------------------------------------

  const [overdueTasks, todayTasks, upcomingTasks, goals, notifications, memories, preferences] =
    await Promise.all([
      // Overdue: due before now and not finished
      Task.findAll({
        where: {
          user_id: userId,
          due_at: { [Op.lt]: now },
          status: { [Op.notIn]: ['completed', 'cancelled'] },
        },
        order: [['due_at', 'ASC']],
        limit: 10,
      }),

      // Today: due within today's window and not finished
      Task.findAll({
        where: {
          user_id: userId,
          due_at: { [Op.between]: [startOfToday(), endOfToday()] },
          status: { [Op.notIn]: ['completed', 'cancelled'] },
        },
        order: [['due_at', 'ASC']],
        limit: 10,
      }),

      // Upcoming: next 7 days, not finished
      Task.findAll({
        where: {
          user_id: userId,
          due_at: { [Op.between]: [endOfToday(), inDays(7)] },
          status: { [Op.notIn]: ['completed', 'cancelled'] },
        },
        order: [['due_at', 'ASC']],
        limit: 10,
      }),

      // Active goals
      Goal.findAll({
        where: { user_id: userId, status: 'active' },
        order: [['created_at', 'DESC']],
        limit: 5,
      }),

      // Unread notifications
      Notification.findAll({
        where: { user_id: userId, read_at: null },
        order: [['created_at', 'DESC']],
        limit: 5,
      }),

      // Top memories (high importance first, then recent)
      Memory.findAll({
        where: { user_id: userId },
        order: [
          ['importance', 'DESC'],
          ['updated_at', 'DESC'],
        ],
        limit: 5,
      }),

      // Preferences (for AI narrative toggle + timezone)
      UserPreference.findOne({ where: { user_id: userId } }),
    ]);

  const mapTasks = (tasks: Task[]) =>
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueAt: t.due_at,
    }));

  const briefing: DailyBriefing = {
    date: now.toISOString(),
    summary: {
      overdueCount: overdueTasks.length,
      todayCount: todayTasks.length,
      upcomingCount: upcomingTasks.length,
      activeGoals: goals.length,
      unreadNotifications: notifications.length,
    },
    overdueTasks: mapTasks(overdueTasks),
    todayTasks: mapTasks(todayTasks),
    upcomingTasks: mapTasks(upcomingTasks),
    goals: goals.map((g) => ({ id: g.id, title: g.title, progress: g.progress })),
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
    })),
    topMemories: memories.map((m) => ({ id: m.id, type: m.type, content: m.content })),
  };

  // -------------------------------------------------
  //  Optional AI narrative (only when Groq is ready)
  // -------------------------------------------------

  const aiEnabled =
    config.ai.provider === 'groq' &&
    Boolean(config.ai.groqApiKey) &&
    (preferences?.daily_briefing_enabled ?? true);

  if (aiEnabled) {
    try {
      briefing.aiNarrative = await generateBriefingNarrative(userId, briefing);
    } catch (error) {
      // Deterministic briefing is already complete — AI narrative is optional
      console.error(`❌ [Briefing] AI narrative skipped: ${(error as Error).message}`);
      await logActivity({
        userId,
        actionPerformed: 'AI_PROVIDER_FAILURE',
        description: `Briefing narrative failed: ${(error as Error).message}`,
        status: 'failed',
      });
    }
  }

  return briefing;
};

/**
 * Generates an AI narrative for the briefing using ONLY
 * the user's gathered data (never fabricated facts).
 */
const generateBriefingNarrative = async (
  userId: number,
  briefing: {
    summary: unknown;
    overdueTasks: unknown[];
    todayTasks: unknown[];
    upcomingTasks: unknown[];
    goals: unknown[];
  }
): Promise<string> => {
  const provider = getProvider();

  const system = [
    buildSystemPrompt(null),
    '',
    'You are generating a short daily briefing narrative.',
    'Use ONLY the supplied user data.',
    'Never invent tasks, deadlines, meetings, or facts.',
    'If there is nothing important, say so briefly.',
    'Keep it under 150 words.',
  ].join('\n');

  const userData = JSON.stringify({
    summary: briefing.summary,
    overdueTasks: briefing.overdueTasks,
    todayTasks: briefing.todayTasks,
    upcomingTasks: briefing.upcomingTasks,
    goals: briefing.goals,
  });

  try {
    return await provider.chat({
      system,
      messages: [{ role: 'user', content: `Here is the user's current state — write the briefing narrative:\n${userData}` }],
    });
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw new Error(error.message);
    }
    throw error;
  }
};
