/**
 * ===========================================
 *  Conversation Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating conversation requests.
 */

import Joi from 'joi';

/**
 * Validates conversation creation (title is optional —
 * defaults to "New conversation" server-side).
 */
export const createConversationSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .allow('')
    .messages({
      'string.max': 'Title must not exceed 255 characters',
    }),
});

/**
 * Validates conversation rename requests.
 */
export const renameConversationSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Title is required',
      'string.max': 'Title must not exceed 255 characters',
      'any.required': 'Title is required',
    }),
});

/**
 * Validates the conversation ID path parameter.
 */
export const conversationIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Conversation ID must be a number',
      'any.required': 'Conversation ID is required',
    }),
});

/**
 * Validates the message ID path parameter.
 */
export const messageIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Message ID must be a number',
      'any.required': 'Message ID is required',
    }),
});
