/**
 * ===========================================
 *  Habit Routes
 * ===========================================
 *
 * GET    /api/habits           — List habits
 * POST   /api/habits           — Create a habit
 * PUT    /api/habits/:id       — Update a habit
 * POST   /api/habits/:id/toggle — Toggle today's completion log
 * DELETE /api/habits/:id       — Delete a habit
 */

import { Router } from 'express';
import {
  listHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
} from '../controllers/habit.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createHabitSchema,
  updateHabitSchema,
  habitIdParamSchema,
} from '../validators/habit.validator';

const router = Router();

/** All habit routes require a valid JWT */
router.use(verifyToken);

router.get('/', listHabits);
router.post('/', validate(createHabitSchema), createHabit);
router.put(
  '/:id',
  validate(habitIdParamSchema, 'params'),
  validate(updateHabitSchema),
  updateHabit
);
router.post('/:id/toggle', validate(habitIdParamSchema, 'params'), toggleHabitLog);
router.delete('/:id', validate(habitIdParamSchema, 'params'), deleteHabit);

export default router;
