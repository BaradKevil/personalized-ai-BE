/**
 * ===========================================
 *  Notification Service
 * ===========================================
 *
 * Business logic for notifications. Notifications
 * belong to the owning user — every operation is
 * scoped to the authenticated user.
 *
 * Notifications are created by backend logic (e.g. the
 * proactive scheduler) via createNotification — there is
 * no public "create" endpoint.
 */

import { Transaction } from 'sequelize';
import { Notification, sequelize } from '../models';
import { NotificationPriority, NotificationType } from '../models/notification.model';
import { toNotificationPayload } from '../utils/serializers';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for creating a notification (internal use) */
export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message?: string | null;
  priority?: NotificationPriority;
  metadata?: object | null;
}

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Creates a notification (used by backend logic:
 * deadlines, reminders, AI suggestions, scheduler).
 */
export const createNotification = async (
  input: CreateNotificationInput,
  transaction?: Transaction
): Promise<ReturnType<typeof toNotificationPayload>> => {
  const notification = await Notification.create(
    {
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      priority: input.priority ?? 'medium',
      metadata: input.metadata ?? null,
    },
    { transaction }
  );

  return toNotificationPayload(notification);
};

/**
 * Lists the user's notifications, newest first.
 */
export const listNotificationsByUser = async (
  userId: number
): Promise<ReturnType<typeof toNotificationPayload>[]> => {
  const notifications = await Notification.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: 100,
  });

  return notifications.map(toNotificationPayload);
};

/**
 * Returns the unread notification count for a user.
 */
export const unreadCountByUser = async (userId: number): Promise<number> => {
  return Notification.count({
    where: {
      user_id: userId,
      read_at: null,
    },
  });
};

/**
 * Marks all notifications of a user as read.
 */
export const markAllReadByUser = async (
  userId: number
): Promise<ReturnType<typeof toNotificationPayload>[]> => {
  return sequelize.transaction(async (transaction) => {
    await Notification.update(
      { read_at: new Date() },
      {
        where: { user_id: userId, read_at: null },
        transaction,
      }
    );

    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 100,
      transaction,
    });

    return notifications.map(toNotificationPayload);
  });
};
