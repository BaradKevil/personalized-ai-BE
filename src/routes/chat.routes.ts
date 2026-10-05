/**
 * ===========================================
 *  Chat Routes
 * ===========================================
 *
 * Conversations, messages, and AI replies.
 * All routes require authentication.
 *
 *  GET    /api/chat/conversations
 *  POST   /api/chat/conversations
 *  PUT    /api/chat/conversations/:id
 *  DELETE /api/chat/conversations/:id
 *  GET    /api/chat/conversations/:id/messages
 *  POST   /api/chat/conversations/:id/messages
 *  POST   /api/chat/conversations/:id/regenerate
 *  PUT    /api/chat/messages/:id
 *  DELETE /api/chat/messages/:id
 */

import { Router } from 'express';
import {
  listConversations,
  createConversation,
  renameConversation,
  deleteConversation,
  listMessages,
  sendMessage,
  regenerateReply,
  editMessage,
  deleteMessage,
} from '../controllers/chat.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { aiLimiter } from '../middlewares/rate-limit.middleware';
import {
  createConversationSchema,
  renameConversationSchema,
  conversationIdParamSchema,
  messageIdParamSchema,
} from '../validators/conversation.validator';
import { sendMessageSchema, editMessageSchema } from '../validators/message.validator';

const router = Router();

/** All chat routes require a valid JWT */
router.use(verifyToken);

// -------------------------------------------------
//  Conversations
// -------------------------------------------------

router.get('/conversations', listConversations);
router.post('/conversations', validate(createConversationSchema), createConversation);
router.put(
  '/conversations/:id',
  validate(conversationIdParamSchema, 'params'),
  validate(renameConversationSchema),
  renameConversation
);
router.delete(
  '/conversations/:id',
  validate(conversationIdParamSchema, 'params'),
  deleteConversation
);

// -------------------------------------------------
//  Messages & AI
// -------------------------------------------------

router.get(
  '/conversations/:id/messages',
  validate(conversationIdParamSchema, 'params'),
  listMessages
);

// AI endpoints are rate-limited because they consume provider quota
router.post(
  '/conversations/:id/messages',
  validate(conversationIdParamSchema, 'params'),
  validate(sendMessageSchema),
  aiLimiter,
  sendMessage
);

router.post(
  '/conversations/:id/regenerate',
  validate(conversationIdParamSchema, 'params'),
  aiLimiter,
  regenerateReply
);

router.put(
  '/messages/:id',
  validate(messageIdParamSchema, 'params'),
  validate(editMessageSchema),
  editMessage
);

router.delete(
  '/messages/:id',
  validate(messageIdParamSchema, 'params'),
  deleteMessage
);

export default router;
