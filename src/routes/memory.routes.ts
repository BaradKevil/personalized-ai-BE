/**
 * ===========================================
 *  Memory Routes
 * ===========================================
 *
 * GET    /api/memory          — List memories (?search=)
 * POST   /api/memory          — Create a memory
 * PUT    /api/memory/:id      — Update a memory
 * DELETE /api/memory/:id      — Forget a memory
 */

import { Router } from 'express';
import { listMemories, createMemory, updateMemory, deleteMemory } from '../controllers/memory.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createMemorySchema, updateMemorySchema, memoryIdParamSchema } from '../validators/memory.validator';

const router = Router();

/** All memory routes require a valid JWT */
router.use(verifyToken);

router.get('/', listMemories);
router.post('/', validate(createMemorySchema), createMemory);
router.put(
  '/:id',
  validate(memoryIdParamSchema, 'params'),
  validate(updateMemorySchema),
  updateMemory
);
router.delete(
  '/:id',
  validate(memoryIdParamSchema, 'params'),
  deleteMemory
);

export default router;
