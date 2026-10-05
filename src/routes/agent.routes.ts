/**
 * ===========================================
 *  Agent Routes
 * ===========================================
 *
 * GET  /api/agent — Fetch the user's personal AI agent
 * PUT  /api/agent — Update the user's personal AI agent
 */

import { Router } from 'express';
import { getAgent, updateAgent } from '../controllers/agent.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateAgentSchema } from '../validators/agent.validator';

const router = Router();

/**
 * GET /api/agent
 * Protected — requires a valid JWT.
 */
router.get('/', verifyToken, getAgent);

/**
 * PUT /api/agent
 * Protected — requires a valid JWT.
 */
router.put('/', verifyToken, validate(updateAgentSchema), updateAgent);

export default router;
