/**
 * ===========================================
 *  Activity Log Service
 * ===========================================
 *
 * Provides helper functions to record audit log entries
 * for user and system events in the activity_logs table.
 * Supports database transactions.
 */

import { Transaction } from 'sequelize';
import { ActivityLog } from '../models';
import { ActivityLogStatus } from '../models/activity-log.model';
import { toActivityLogPayload } from '../utils/serializers';

/** Options interface for creating an activity log */
export interface CreateLogOptions {
  userId?: number | null;
  actionPerformed: string;
  ipAddress?: string | null;
  description?: string | null;
  status?: ActivityLogStatus;
  transaction?: Transaction;
}

/**
 * Creates a new activity log entry in the database.
 *
 * @param options - Log parameters including action, user ID, IP address, description, status, and transaction
 */
export const logActivity = async (options: CreateLogOptions): Promise<ActivityLog> => {
  return ActivityLog.create(
    {
      user_id: options.userId ?? null,
      action_performed: options.actionPerformed,
      ip_address: options.ipAddress ?? null,
      description: options.description ?? null,
      status: options.status ?? 'success',
    },
    { transaction: options.transaction }
  );
};

// -------------------------------------------------
//  Paginated Read (User's Own Logs)
// -------------------------------------------------

/** Paginated activity log result */
export interface PaginatedLogs {
  items: ReturnType<typeof toActivityLogPayload>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Lists a user's activity logs with pagination.
 *
 * @param userId - The owning user (ownership enforced here)
 * @param page - 1-based page number
 * @param limit - Items per page (capped)
 */
export const listLogsByUser = async (
  userId: number,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedLogs> => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;

  const { rows, count } = await ActivityLog.findAndCountAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    offset,
    limit: safeLimit,
  });

  return {
    items: rows.map(toActivityLogPayload),
    total: count,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(count / safeLimit),
  };
};
