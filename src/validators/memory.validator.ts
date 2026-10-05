/**
 * ===========================================
 *  Memory Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating memory requests.
 */

import Joi from 'joi';

/**
 * Validates memory creation.
 */
export const createMemorySchema = Joi.object({
  category: Joi.string()
    .max(50)
    .allow('', null)
    .messages({
      'string.max': 'Category must not exceed 50 characters',
    }),

  content: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Memory content is required',
      'string.max': 'Memory content must not exceed 5000 characters',
      'any.required': 'Memory content is required',
    }),

  importance: Joi.string()
    .valid('low', 'medium', 'high')
    .messages({
      'any.only': 'Importance must be one of: low, medium, high',
    }),

  source: Joi.string()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'Source must not exceed 100 characters',
    }),
});

/**
 * Validates memory updates (all fields optional).
 */
export const updateMemorySchema = Joi.object({
  category: Joi.string()
    .max(50)
    .allow('', null)
    .messages({
      'string.max': 'Category must not exceed 50 characters',
    }),

  content: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .messages({
      'string.min': 'Memory content is required',
      'string.max': 'Memory content must not exceed 5000 characters',
    }),

  importance: Joi.string()
    .valid('low', 'medium', 'high')
    .messages({
      'any.only': 'Importance must be one of: low, medium, high',
    }),
}).min(1).messages({
  'object.min': 'At least one field is required to update a memory',
});

/**
 * Validates the memory ID path parameter.
 */
export const memoryIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Memory ID must be a number',
      'any.required': 'Memory ID is required',
    }),
});
