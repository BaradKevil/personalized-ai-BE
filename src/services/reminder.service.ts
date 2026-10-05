/**
 * ===========================================
 *  Reminder Service
 * ===========================================
 *
 * Aggregates everything the user should be reminded of:
 * open tasks due in the near future, and unread reminder
 * notifications. Reminders are real data — tasks with due
 * dates and notifications created by the backend.
 */

import { Op } from 'sequelize';
import { Notification, Task } from '../models';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

export interface UpcomingReminder {
  id: number;
  kind: 'task' | 'notification';
  title: string;
  detail: string | null;
  dueAt: string | null;
  priority: string | null;
  read: boolean | null;
}

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Lists open tasks due in the next `days` (default 7) plus
 * unread reminder notifications, sorted soonest first.
 */
export const listUpcomingReminders = async (
  userId: number,
  days = 7
): Promise<UpcomingReminder[]> => {
  const now = new Date();
  const horizon = new Date(now.getTime() + days * 86400000);

  const [tasks, notifications] = await Promise.all([
    Task.findAll({
      where: {
        user_id: userId,
        status: { [Op.ne]: 'completed' },
        due_at: { [Op.gte]: now, [Op.lte]: horizon },
      },
      order: [['due_at', 'ASC']],
      limit: 30,
    }),
    Notification.findAll({
      where: {
        user_id: userId,
        type: 'reminder',
        read_at: null,
      },
      order: [['created_at', 'DESC']],
      limit: 20,
    }),
  ]);

  const reminders: UpcomingReminder[] = [];

  for (const task of tasks) {
    if (!task.due_at) continue;
    reminders.push({
      id: task.id,
      kind: 'task',
      title: task.title,
      detail: task.notes,
      dueAt: task.due_at.toISOString(),
      priority: task.priority,
      read: null,
    });
  }

  for (const notification of notifications) {
    reminders.push({
      id: notification.id,
      kind: 'notification',
      title: notification.title,
      detail: notification.message,
      dueAt: notification.created_at.toISOString(),
      priority: notification.priority,
      read: false,
    });
  }

  return reminders.sort((a, b) => {
    if (!a.dueAt || !b.dueAt) return 0;
    return a.dueAt.localeCompare(b.dueAt);
  });
};
