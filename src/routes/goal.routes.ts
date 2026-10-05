/**
 * ===========================================
 *  Goal Routes
 * ===========================================
 *
 * GET    /api/goals                          — List goals
 * POST   /api/goals                          — Create a goal
 * PUT    /api/goals/:id                      — Update a goal
 * POST   /api/goals/:goalId/steps/:stepId/toggle — Toggle a step
 * DELETE /api/goals/:id                      — Delete a goal
 */

import { Router } from 'express';
import { listGoals, createGoal, updateGoal, toggleGoalStep, deleteGoal } from '../controllers/goal.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createGoalSchema, updateGoalSchema, goalStepParamSchema, goalIdParamSchema } from '../validators/goal.validator';

const router = Router();

/** All goal routes require a valid JWT */
router.use(verifyToken);

router.get('/', listGoals);
router.post('/', validate(createGoalSchema), createGoal);
router.put(
  '/:id',
  validate(goalIdParamSchema, 'params'),
  validate(updateGoalSchema),
  updateGoal
);
router.post(
  '/:goalId/steps/:stepId/toggle',
  validate(goalStepParamSchema, 'params'),
  toggleGoalStep
);
router.delete(
  '/:id',
  validate(goalIdParamSchema, 'params'),
  deleteGoal
);

export default router;
