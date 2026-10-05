/**
 * ===========================================
 *  Habit Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating habit requests.
 */

import Joi from 'joi';

/** Shared habit field definitions */
const habitFields = {
  name: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .messages({
      'string.min': 'Habit name is required',
      'string.max': 'Habit name must not exceed 255 characters',
    }),

  frequency: Joi.string()
    .valid('daily', 'weekly')
    .messages({
      'any.only': 'Frequency must be one of: daily, weekly',
    }),

  icon: Joi.string().allow('', null).max(50),
  color: Joi.string().allow('', null).max(20),
};

/** Validates habit creation. */
export const createHabitSchema = Joi.object({
  name: habitFields.name.required(),
  frequency: habitFields.frequency,
  icon: habitFields.icon,
  color: habitFields.color,
});

/** Validates habit updates (all fields optional). */
export const updateHabitSchema = Joi.object(habitFields).min(1).messages({
  'object.min': 'At least one field is required to update a habit',
});

/** Validates the habit ID path parameter. */
export const habitIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Habit ID must be a number',
    'any.required': 'Habit ID is required',
  }),
});
