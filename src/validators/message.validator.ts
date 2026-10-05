/**
 * ===========================================
 *  Message Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating message requests.
 */

import Joi from 'joi';

/**
 * Validates the message send request body.
 *
 * Two shapes share this endpoint:
 *  - { content }                          → user message, returns AI reply
 *  - { role: 'agent', content }           → persist a final assistant message
 */
export const sendMessageSchema = Joi.object({
  role: Joi.string()
    .valid('user', 'agent')
    .messages({
      'any.only': 'Role must be either "user" or "agent"',
    }),

  content: Joi.string()
    .trim()
    .min(1)
    .max(20000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message must not exceed 20000 characters',
      'any.required': 'Message content is required',
    }),
});

/**
 * Validates message edit requests.
 */
export const editMessageSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(20000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message must not exceed 20000 characters',
      'any.required': 'Message content is required',
    }),
});
