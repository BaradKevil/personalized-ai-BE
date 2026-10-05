/**
 * ===========================================
 *  Goal Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating goal requests.
 */

import Joi from 'joi';

/** A single goal step */
const goalStepSchema = Joi.object({
  id: Joi.string().required(),
  text: Joi.string().max(255).required(),
  done: Joi.boolean().default(false),
});

/**
 * Validates goal creation.
 */
export const createGoalSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Goal title is required',
      'string.max': 'Goal title must not exceed 255 characters',
      'any.required': 'Goal title is required',
    }),

  description: Joi.string()
    .allow('', null)
    .max(5000)
    .messages({
      'string.max': 'Description must not exceed 5000 characters',
    }),

  targetDate: Joi.date()
    .allow(null)
    .messages({
      'date.base': 'Target date must be a valid date',
    }),

  steps: Joi.array()
    .items(goalStepSchema)
    .max(50)
    .messages({
      'array.max': 'A goal can have at most 50 steps',
    }),
});

/**
 * Validates goal updates (all fields optional).
 */
export const updateGoalSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .messages({
      'string.min': 'Goal title is required',
      'string.max': 'Goal title must not exceed 255 characters',
    }),

  description: Joi.string()
    .allow('', null)
    .max(5000)
    .messages({
      'string.max': 'Description must not exceed 5000 characters',
    }),

  status: Joi.string()
    .valid('active', 'completed', 'archived')
    .messages({
      'any.only': 'Status must be one of: active, completed, archived',
    }),

  targetDate: Joi.date()
    .allow(null)
    .messages({
      'date.base': 'Target date must be a valid date',
    }),

  steps: Joi.array()
    .items(goalStepSchema)
    .max(50)
    .messages({
      'array.max': 'A goal can have at most 50 steps',
    }),
}).min(1).messages({
  'object.min': 'At least one field is required to update a goal',
});

/**
 * Validates the goal ID + step ID path parameters.
 */
export const goalStepParamSchema = Joi.object({
  goalId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Goal ID must be a number',
      'any.required': 'Goal ID is required',
    }),

  stepId: Joi.string()
    .required()
    .messages({
      'any.required': 'Step ID is required',
    }),
});

/**
 * Validates the goal ID path parameter.
 */
export const goalIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Goal ID must be a number',
      'any.required': 'Goal ID is required',
    }),
});
