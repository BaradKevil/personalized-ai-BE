/**
 * ===========================================
 *  Task Validation Schemas
 * ===========================================
 *
 * Joi schemas for validating task requests.
 */

import Joi from 'joi';

/** Shared task field definitions */
const taskFields = {
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .messages({
      'string.min': 'Task title is required',
      'string.max': 'Task title must not exceed 255 characters',
    }),

  notes: Joi.string()
    .allow('', null)
    .max(5000)
    .messages({
      'string.max': 'Notes must not exceed 5000 characters',
    }),

  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .messages({
      'any.only': 'Priority must be one of: low, medium, high',
    }),

  dueDate: Joi.date()
    .allow(null)
    .messages({
      'date.base': 'Due date must be a valid date',
    }),

  recurrence: Joi.string()
    .valid('none', 'daily', 'weekly', 'monthly')
    .messages({
      'any.only': 'Recurrence must be one of: none, daily, weekly, monthly',
    }),

  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .messages({
      'array.max': 'A task can have at most 20 tags',
    }),
};

/**
 * Validates task creation.
 */
export const createTaskSchema = Joi.object({
  title: taskFields.title.required(),
  notes: taskFields.notes,
  priority: taskFields.priority,
  dueDate: taskFields.dueDate,
  recurrence: taskFields.recurrence,
  tags: taskFields.tags,
});

/**
 * Validates task updates (all fields optional).
 */
export const updateTaskSchema = Joi.object(taskFields).min(1).messages({
  'object.min': 'At least one field is required to update a task',
});

/**
 * Validates the task ID path parameter.
 */
export const taskIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Task ID must be a number',
      'any.required': 'Task ID is required',
    }),
});
