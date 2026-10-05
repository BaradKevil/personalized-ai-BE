/**
 * ===========================================
 *  User Profile Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating user profile updates.
 */

import Joi from 'joi';

/**
 * Validates the profile update request body (all fields optional).
 */
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 255 characters',
    }),

  mobile: Joi.string()
    .pattern(/^\+?[\d\s-]{8,15}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid mobile number',
    }),

  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),

  avatarColor: Joi.string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Avatar color must be a hex color (e.g. #C26A44)',
    }),

  timezone: Joi.string()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'Timezone must not exceed 100 characters',
    }),
}).min(1).messages({
  'object.min': 'At least one field is required to update the profile',
});

/**
 * Validates the account-deletion request body.
 * The account password must be supplied as confirmation.
 */
export const deleteAccountSchema = Joi.object({
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required to delete your account',
    }),
});
