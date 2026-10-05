/**
 * ===========================================
 *  Task Routes
 * ===========================================
 *
 * GET    /api/tasks           — List tasks
 * POST   /api/tasks           — Create a task
 * PUT    /api/tasks/:id       — Update a task
 * POST   /api/tasks/:id/toggle — Toggle completion
 * DELETE /api/tasks/:id       — Delete a task
 */

import { Router } from 'express';
import { listTasks, createTask, updateTask, toggleTask, deleteTask } from '../controllers/task.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema, taskIdParamSchema } from '../validators/task.validator';

const router = Router();

/** All task routes require a valid JWT */
router.use(verifyToken);

router.get('/', listTasks);
router.post('/', validate(createTaskSchema), createTask);
router.put(
  '/:id',
  validate(taskIdParamSchema, 'params'),
  validate(updateTaskSchema),
  updateTask
);
router.post(
  '/:id/toggle',
  validate(taskIdParamSchema, 'params'),
  toggleTask
);
router.delete(
  '/:id',
  validate(taskIdParamSchema, 'params'),
  deleteTask
);

export default router;
