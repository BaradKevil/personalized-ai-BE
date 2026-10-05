/**
 * ===========================================
 *  Calendar Service
 * ===========================================
 *
 * Aggregates the user's dated items (tasks with due dates,
 * goals with target dates) into calendar events for a month.
 * Everything is scoped to the authenticated user.
 */

import { Op } from 'sequelize';
import { Goal, Task } from '../models';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

export interface CalendarEvent {
  id: number;
  kind: 'task' | 'goal';
  title: string;
  date: string;
  time: string | null;
  priority: string | null;
  completed: boolean;
  progress: number | null;
  status: string | null;
}

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

const iso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Lists calendar events for a month.
 *
 * @param month - "YYYY-MM" (defaults to the current month)
 */
export const listMonthEvents = async (
  userId: number,
  month?: string
): Promise<CalendarEvent[]> => {
  const now = new Date();
  const year = month ? Number(month.slice(0, 4)) : now.getFullYear();
  const mon = month ? Number(month.slice(5, 7)) : now.getMonth() + 1;

  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const [tasks, goals] = await Promise.all([
    Task.findAll({
      where: {
        user_id: userId,
        due_at: { [Op.gte]: start, [Op.lt]: end },
      },
      order: [['due_at', 'ASC']],
    }),
    Goal.findAll({
      where: {
        user_id: userId,
        target_date: { [Op.gte]: start, [Op.lt]: end },
      },
      order: [['target_date', 'ASC']],
    }),
  ]);

  const events: CalendarEvent[] = [];

  for (const task of tasks) {
    if (!task.due_at) continue;
    events.push({
      id: task.id,
      kind: 'task',
      title: task.title,
      date: iso(new Date(task.due_at)),
      time: new Date(task.due_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      priority: task.priority,
      completed: task.status === 'completed',
      progress: null,
      status: task.status,
    });
  }

  for (const goal of goals) {
    if (!goal.target_date) continue;
    events.push({
      id: goal.id,
      kind: 'goal',
      title: goal.title,
      date: iso(new Date(goal.target_date)),
      time: null,
      priority: null,
      completed: goal.status === 'completed',
      progress: goal.progress,
      status: goal.status,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
};
