/**
 * ===========================================
 *  User Service
 * ===========================================
 *
 * Business logic for user-related operations.
 * Separates data access concerns from the controller layer.
 * Supports database transactions.
 */

import { Op, Transaction } from 'sequelize';
import { User, sequelize } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { toUserPayload } from '../utils/serializers';
import { logActivity } from './activity-log.service';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for updating user profile (camelCase API contract) */
export interface UpdateProfileInput {
  name?: string;
  mobile?: string;
  email?: string;
  avatarColor?: string;
  timezone?: string;
}

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Retrieves a user's profile by their ID.
 * Excludes sensitive fields like password.
 *
 * @param userId - The ID of the user to retrieve
 * @param transaction - Optional Sequelize Transaction
 * @throws AppError(404) if user not found
 */
export const getUserProfile = async (
  userId: number,
  transaction?: Transaction
): Promise<ReturnType<typeof toUserPayload>> => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    transaction,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return toUserPayload(user);
};

/**
 * Updates a user's profile information within a transaction.
 *
 * @param userId - The ID of the user to update
 * @param input - Profile update fields (camelCase)
 * @param externalTransaction - Optional external transaction to join
 */
export const updateUserProfile = async (
  userId: number,
  input: UpdateProfileInput,
  externalTransaction?: Transaction
): Promise<ReturnType<typeof toUserPayload>> => {
  const executeUpdate = async (transaction: Transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Email is unique across the table — reject a duplicate before saving
    if (input.email !== undefined && input.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await User.findOne({
        where: { id: { [Op.ne]: userId }, email: input.email },
        transaction,
      });
      if (existing) {
        throw new AppError('Email already registered', 409);
      }
    }

    await user.update(
      {
        ...(input.name !== undefined && { full_name: input.name }),
        ...(input.mobile !== undefined && { mobile_number: input.mobile }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.avatarColor !== undefined && { avatar_color: input.avatarColor }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
      },
      { transaction }
    );

    return toUserPayload(user);
  };

  if (externalTransaction) {
    return executeUpdate(externalTransaction);
  }

  return sequelize.transaction(executeUpdate);
};

/**
 * Permanently deletes the authenticated user's account.
 *
 * Requires the account password as confirmation. Every owned
 * record (agent, preferences, tokens, conversations, messages,
 * memories, tasks, goals, notifications) cascades on delete;
 * activity logs keep their rows with user_id set to NULL.
 */
export const deleteAccount = async (
  userId: number,
  password: string,
  ipAddress?: string
): Promise<void> => {
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Password is incorrect', 401);
    }

    await logActivity({
      userId,
      actionPerformed: 'ACCOUNT_DELETED',
      ipAddress,
      description: `User '${user.email}' deleted their account`,
      transaction,
    });

    await user.destroy({ transaction });
  });
};
