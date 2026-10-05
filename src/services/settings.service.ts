/**
 * ===========================================
 *  Settings Service
 * ===========================================
 *
 * Business logic for user preferences (settings).
 * One preferences row per user, provisioned at registration.
 */

import { Transaction } from 'sequelize';
import { UserPreference, sequelize } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { toSettingsPayload } from '../utils/serializers';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for updating settings (camelCase API contract) */
export interface UpdateSettingsInput {
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  memoryEnabled?: boolean;
  conciseAnswers?: boolean;
  dailyBriefing?: boolean;
  proactiveSuggestions?: boolean;
  inAppNotifications?: boolean;
  browserNotifications?: boolean;
}

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Retrieves the settings for a user.
 * Throws 404 if preferences were not provisioned.
 *
 * @param userId - The ID of the owning user
 * @param transaction - Optional Sequelize Transaction
 */
export const getSettingsByUserId = async (
  userId: number,
  transaction?: Transaction
): Promise<ReturnType<typeof toSettingsPayload>> => {
  const prefs = await UserPreference.findOne({
    where: { user_id: userId },
    transaction,
  });

  if (!prefs) {
    throw new AppError('Settings not found for this user', 404);
  }

  return toSettingsPayload(prefs);
};

/**
 * Updates the settings for a user (partial update).
 *
 * @param userId - The ID of the owning user (ownership enforced here)
 * @param input - Settings update fields (camelCase)
 * @param externalTransaction - Optional external transaction to join
 */
export const updateSettingsByUserId = async (
  userId: number,
  input: UpdateSettingsInput,
  externalTransaction?: Transaction
): Promise<ReturnType<typeof toSettingsPayload>> => {
  const executeUpdate = async (transaction: Transaction) => {
    const prefs = await UserPreference.findOne({
      where: { user_id: userId },
      transaction,
    });

    if (!prefs) {
      throw new AppError('Settings not found for this user', 404);
    }

    await prefs.update(
      {
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.language !== undefined && { language: input.language }),
        ...(input.theme !== undefined && { theme: input.theme }),
        ...(input.memoryEnabled !== undefined && { memory_enabled: input.memoryEnabled }),
        ...(input.conciseAnswers !== undefined && { concise_answers: input.conciseAnswers }),
        ...(input.dailyBriefing !== undefined && { daily_briefing_enabled: input.dailyBriefing }),
        ...(input.proactiveSuggestions !== undefined && { proactive_suggestions: input.proactiveSuggestions }),
        ...(input.inAppNotifications !== undefined && { in_app_notifications: input.inAppNotifications }),
        ...(input.browserNotifications !== undefined && { browser_notifications: input.browserNotifications }),
      },
      { transaction }
    );

    return toSettingsPayload(prefs);
  };

  if (externalTransaction) {
    return executeUpdate(externalTransaction);
  }

  return sequelize.transaction(executeUpdate);
};
