/**
 * ===========================================
 *  Authentication Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating authentication-related
 * request payloads (registration, login, refresh token).
 */

import Joi from 'joi';

// -------------------------------------------------
//  Register Schema
// -------------------------------------------------

/**
 * Validates the registration request body.
 * Matches the Novi frontend registration form.
 */
export const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 255 characters',
      'any.required': 'Full name is required',
    }),

  mobile: Joi.string()
    .pattern(/^\+?[\d\s-]{8,15}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid mobile number',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one letter and one number',
      'any.required': 'Password is required',
    }),

  timezone: Joi.string()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'Timezone must not exceed 100 characters',
    }),
});

// -------------------------------------------------
//  Login Schema
// -------------------------------------------------

/**
 * Validates the login request body.
 * `identifier` may be an email address or a mobile number.
 */
export const loginSchema = Joi.object({
  identifier: Joi.string()
    .required()
    .messages({
      'any.required': 'Email or mobile number is required',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

// -------------------------------------------------
//  Refresh Token Schema
// -------------------------------------------------

/**
 * Validates the refresh token request body.
 */
export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required',
    }),
});

// -------------------------------------------------
//  Change Password Schema
// -------------------------------------------------

/**
 * Validates the change-password request body.
 * The current password must be supplied; the new password
 * follows the same strength rules as registration.
 */
export const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),

  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one letter and one number',
      'any.required': 'New password is required',
    }),
});
