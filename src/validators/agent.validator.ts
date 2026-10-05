/**
 * ===========================================
 *  Agent Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating agent updates.
 */

import Joi from 'joi';

/**
 * Validates the agent update request body (all fields optional).
 */
export const updateAgentSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Agent name must be at least 1 character long',
      'string.max': 'Agent name must not exceed 100 characters',
    }),

  avatar: Joi.string()
    .max(50)
    .allow('', null)
    .messages({
      'string.max': 'Avatar must not exceed 50 characters',
    }),

  color: Joi.string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Color must be a hex color (e.g. #C26A44)',
    }),

  personality: Joi.string()
    .max(4000)
    .allow('', null)
    .messages({
      'string.max': 'Personality must not exceed 4000 characters',
    }),
}).min(1).messages({
  'object.min': 'At least one field is required to update the agent',
});
