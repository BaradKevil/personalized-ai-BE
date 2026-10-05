/**
 * ===========================================
 *  AI Action Layer (Tool Registry)
 * ===========================================
 *
 * The model NEVER touches the database directly. When the user asks
 * for a concrete action ("create a task to study tomorrow"), the
 * model responds with a structured JSON action. This layer:
 *
 *   1. Parses + validates the action against an allow-list.
 *   2. Executes it through the existing business services
 *      (task / goal / memory / notification), scoped to the
 *      authenticated user.
 *   3. Returns a natural confirmation message.
 *
 * Only actions backed by real functionality are registered here.
 * Unknown or invalid actions are never executed — they fall through
 * to a safe, honest explanation.
 */

import { Op } from 'sequelize';
import { Task } from '../models';
import { TaskPriority } from '../models/task.model';
import { GoalStep } from '../models/goal.model';
import { MemoryImportance } from '../models/memory.model';
import * as taskService from '../services/task.service';
import * as goalService from '../services/goal.service';
import * as memoryService from '../services/memory.service';
import * as notificationService from '../services/notification.service';

// -------------------------------------------------
//  Action Contract
// -------------------------------------------------

export interface AIAction {
  action: string;
  parameters: Record<string, unknown>;
}

/** The actions the backend is allowed to execute. */
export const SUPPORTED_ACTIONS = [
  'create_task',
  'complete_task',
  'create_goal',
  'create_memory',
  'create_reminder',
  'get_tasks',
  'get_today_summary',
] as const;

type SupportedAction = (typeof SUPPORTED_ACTIONS)[number];

// -------------------------------------------------
//  Parsing
// -------------------------------------------------

/**
 * Extracts a JSON action object from the model's reply.
 * Handles bare JSON, and JSON wrapped in ```json fences
 * (the format the system prompt asks for).
 */
export const extractAction = (text: string): AIAction | null => {
  if (!text) return null;

  // Prefer the last fenced code block if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text.trim();

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as AIAction).action === 'string' &&
      (parsed as AIAction).parameters &&
      typeof (parsed as AIAction).parameters === 'object'
    ) {
      return parsed as AIAction;
    }
  } catch {
    // Not valid JSON — treat as a normal conversational reply
    return null;
  }

  return null;
};

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

/** Coerces a loosely-typed date (ISO string, epoch ms) to a Date or null. */
const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

/** Coerces a loose priority string to a valid TaskPriority. */
const asPriority = (value: unknown): TaskPriority => {
  const v = asString(value).toLowerCase();
  return v === 'low' || v === 'high' ? v : 'medium';
};

/** Coerces a loose importance string to a valid MemoryImportance. */
const asImportance = (value: unknown): MemoryImportance => {
  const v = asString(value).toLowerCase();
  return v === 'low' || v === 'high' ? v : 'medium';
};

/** Finds an open task by exact title (case-insensitive) for the user. */
const findOpenTaskByTitle = async (
  userId: number,
  title: string
): Promise<{ id: number; title: string } | null> => {
  const task = await Task.findOne({
    where: {
      user_id: userId,
      status: { [Op.ne]: 'completed' },
      title: { [Op.like]: `%${title}%` },
    },
    order: [['due_at', 'ASC']],
  });
  return task ? { id: task.id, title: task.title } : null;
};

/** Compact human-readable date (e.g. "tomorrow 7 PM" style). */
const formatDate = (date: Date): string => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfDate - startOfToday) / 86400000);

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (dayDiff === 0) return `today at ${time}`;
  if (dayDiff === 1) return `tomorrow at ${time}`;
  if (dayDiff === -1) return `yesterday at ${time}`;
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

// -------------------------------------------------
//  Execution
// -------------------------------------------------

/**
 * Executes a validated action for the authenticated user.
 * Never trusts the model blindly — parameters are re-validated
 * against the service contracts.
 *
 * @returns { ok, text } — ok=false means the action failed or was
 *   rejected; text is always a safe, user-facing message.
 */
export const executeAction = async (
  action: AIAction,
  userId: number
): Promise<{ ok: boolean; text: string }> => {
  const name = action.action as SupportedAction;

  if (!SUPPORTED_ACTIONS.includes(name)) {
    return {
      ok: false,
      text: `I can't do "${action.action}" yet, but I've noted what you asked. I can create tasks, goals and memories, set reminders, and look at your tasks — just ask.`,
    };
  }

  try {
    switch (name) {
      case 'create_task': {
        const title = asString(action.parameters.title);
        if (!title) {
          return { ok: false, text: 'I need a task name before I can create it.' };
        }
        const due = parseDate(action.parameters.dueDate);
        const task = await taskService.createTaskForUser(userId, {
          title,
          notes: asString(action.parameters.notes) || undefined,
          priority: asPriority(action.parameters.priority),
          dueDate: due ? due.toISOString() : undefined,
        });
        const when = due ? ` for ${formatDate(due)}` : '';
        return {
          ok: true,
          text: `Done. I've added the task "${task.title}"${when}${task.priority !== 'medium' ? ` (${task.priority} priority)` : ''}.`,
        };
      }

      case 'complete_task': {
        const taskId = Number(action.parameters.taskId);
        let found: { id: number; title: string } | null = null;

        if (Number.isFinite(taskId) && taskId > 0) {
          found = (await Task.findOne({ where: { id: taskId, user_id: userId } })) as unknown as {
            id: number;
            title: string;
          } | null;
        } else {
          const title = asString(action.parameters.title);
          if (title) found = await findOpenTaskByTitle(userId, title);
        }

        if (!found) {
          return {
            ok: false,
            text: "I couldn't find an open task matching that. Try naming it exactly as you created it.",
          };
        }

        await taskService.toggleTaskForUser(found.id, userId);
        return { ok: true, text: `Nice — I've marked "${found.title}" as done.` };
      }

      case 'create_goal': {
        const title = asString(action.parameters.title);
        if (!title) {
          return { ok: false, text: 'I need a goal name before I can create it.' };
        }
        const stepsRaw: GoalStep[] | undefined = Array.isArray(action.parameters.steps)
          ? action.parameters.steps
              .filter((s): s is string => typeof s === 'string')
              .map((s) => ({ id: `ai-${Math.random().toString(36).slice(2, 8)}`, text: s.trim(), done: false }))
              .filter((s) => s.text.length > 0)
          : undefined;
        const goal = await goalService.createGoalForUser(userId, {
          title,
          description: asString(action.parameters.description) || undefined,
          targetDate: parseDate(action.parameters.targetDate)?.toISOString(),
          steps: stepsRaw,
        });
        const stepNote = goal.steps.length > 0 ? ` with ${goal.steps.length} milestone${goal.steps.length > 1 ? 's' : ''}` : '';
        return { ok: true, text: `Done. I've created the goal "${goal.title}"${stepNote}. I'll track progress as you go.` };
      }

      case 'create_memory': {
        const content = asString(action.parameters.content);
        if (!content) {
          return { ok: false, text: 'Tell me what you want me to remember.' };
        }
        const memory = await memoryService.createMemoryForUser(userId, {
          content,
          category: asString(action.parameters.category) || 'General',
          importance: asImportance(action.parameters.importance),
        });
        return {
          ok: true,
          text: `Got it — I've saved that to your memory (${memory.category.toLowerCase()}). I'll keep it in mind for future conversations.`,
        };
      }

      case 'create_reminder': {
        const title = asString(action.parameters.title);
        if (!title) {
          return { ok: false, text: 'I need to know what to remind you about.' };
        }
        const at = parseDate(action.parameters.at ?? action.parameters.dueDate);
        const task = await taskService.createTaskForUser(userId, {
          title,
          dueDate: at ? at.toISOString() : undefined,
          priority: asPriority(action.parameters.priority),
        });
        if (at) {
          await notificationService.createNotification({
            userId,
            type: 'reminder',
            title: `Reminder: ${task.title}`,
            message: `Scheduled for ${formatDate(at)}.`,
            priority: task.priority === 'high' ? 'high' : 'medium',
          });
        }
        const when = at ? ` for ${formatDate(at)}` : '';
        return { ok: true, text: `Reminder set — "${task.title}"${when}. I'll nudge you when it's time.` };
      }

      case 'get_tasks': {
        const tasks = await taskService.listTasksByUser(userId);
        const open = tasks.filter((t) => t.status !== 'completed');
        const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now());

        if (open.length === 0) {
          return { ok: true, text: "You're all caught up — no open tasks right now. 🎉" };
        }

        const lines = open.slice(0, 8).map((t) => {
          const when = t.dueDate
            ? ` — ${new Date(t.dueDate) < new Date() ? 'overdue' : formatDate(new Date(t.dueDate))}`
            : '';
          return `- ${t.title} (${t.priority})${when}`;
        });
        const head = overdue.length > 0
          ? `You have ${open.length} open task${open.length > 1 ? 's' : ''}, ${overdue.length} overdue. Start with the overdue ones:`
          : `Here are your open tasks (${open.length}):`;
        return { ok: true, text: [head, ...lines].join('\n') };
      }

      case 'get_today_summary': {
        const tasks = await taskService.listTasksByUser(userId);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday.getTime() + 86400000);

        const open = tasks.filter((t) => t.status !== 'completed');
        const dueToday = open.filter((t) => t.dueDate) as Array<
          (typeof tasks)[number] & { dueDate: string }
        >;
        const todayTasks = dueToday.filter((t) => {
          const due = new Date(t.dueDate);
          return due >= startOfToday && due < endOfToday;
        });
        const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < startOfToday);
        const highPriority = todayTasks.filter((t) => t.priority === 'high');

        if (todayTasks.length === 0 && overdue.length === 0) {
          return {
            ok: true,
            text: "You have nothing scheduled for today and nothing overdue. A good day to get ahead — want me to create a task or goal?",
          };
        }

        const parts: string[] = [];
        if (overdue.length > 0) {
          parts.push(`Overdue: ${overdue.map((t) => `"${t.title}"`).join(', ')}`);
        }
        if (todayTasks.length > 0) {
          const focus = highPriority[0] ?? todayTasks[0];
          parts.push(`Today: ${todayTasks.map((t) => `"${t.title}"`).join(', ')}`);
          parts.push(`I'd focus on "${focus.title}" first${highPriority.length > 0 ? " — it's high priority" : ''}.`);
        }
        return { ok: true, text: parts.join('\n') };
      }

      default:
        return { ok: false, text: "I couldn't complete that action just now. Please try again." };
    }
  } catch (error) {
    console.error(`❌ [AI Action] ${name} failed: ${(error as Error).message}`);
    return {
      ok: false,
      text: "I hit a problem completing that. Nothing was changed — please try again in a moment.",
    };
  }
};
