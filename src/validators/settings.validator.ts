/**
 * ===========================================
 *  Settings Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating user preference (settings) updates.
 */

import Joi from 'joi';

/**
 * Validates the settings update request body (all fields optional).
 */
export const updateSettingsSchema = Joi.object({
  timezone: Joi.string()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'Timezone must not exceed 100 characters',
    }),

  language: Joi.string()
    .pattern(/^[a-z]{2}(-[A-Z]{2})?$/)
    .messages({
      'string.pattern.base': 'Language must be a valid language code (e.g. en)',
    }),

  theme: Joi.string()
    .valid('light', 'dark', 'system')
    .messages({
      'any.only': 'Theme must be one of: light, dark, system',
    }),

  memoryEnabled: Joi.boolean(),
  conciseAnswers: Joi.boolean(),
  dailyBriefing: Joi.boolean(),
  proactiveSuggestions: Joi.boolean(),
  inAppNotifications: Joi.boolean(),
  browserNotifications: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field is required to update settings',
});
