/**
 * ===========================================
 *  Chat Controller
 * ===========================================
 *
 * Handles HTTP request/response for conversations,
 * messages, and AI replies. Controllers stay thin —
 * all business logic lives in the services.
 */

import { Request, Response, NextFunction } from 'express';
import * as conversationService from '../services/conversation.service';
import * as messageService from '../services/message.service';
import * as chatService from '../services/chat.service';
import { sendSuccess } from '../utils/response.handler';

// -------------------------------------------------
//  Conversations
// -------------------------------------------------

/**
 * GET /api/chat/conversations
 * Lists the authenticated user's conversations.
 */
export const listConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversations = await conversationService.listConversationsByUser(userId);
    sendSuccess(res, conversations, 'Conversations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/conversations
 * Creates a new conversation. Expects: { title? }
 */
export const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversation = await conversationService.createConversationForUser(userId, req.body);
    sendSuccess(res, conversation, 'Conversation created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/chat/conversations/:id
 * Renames a conversation. Expects: { title }
 */
export const renameConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.id);
    const conversation = await conversationService.renameConversationForUser(
      conversationId,
      userId,
      req.body.title
    );
    sendSuccess(res, conversation, 'Conversation renamed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/conversations/:id
 * Deletes a conversation owned by the user.
 */
export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.id);
    await conversationService.deleteConversationForUser(conversationId, userId);
    sendSuccess(res, null, 'Conversation deleted successfully');
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------
//  Messages & AI
// -------------------------------------------------

/**
 * GET /api/chat/conversations/:id/messages
 * Lists messages of a conversation owned by the user.
 */
export const listMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.id);
    const messages = await messageService.listMessagesByConversation(conversationId, userId);
    sendSuccess(res, messages, 'Messages retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/conversations/:id/messages
 *
 * Two behaviors:
 *  - { content }              → saves the user message, returns the AI reply
 *  - { role: 'agent', content } → persists a final assistant message
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.id);
    const { role, content } = req.body;

    // Persist a final assistant message (useFinishMessage flow)
    // addMessageToConversation already returns the serialized payload
    if (role === 'agent') {
      const message = await messageService.addMessageToConversation(conversationId, userId, {
        role: 'agent',
        content,
      });
      sendSuccess(res, message, 'Message saved successfully');
      return;
    }

    // Normal flow: save user message + generate AI reply
    const result = await chatService.sendMessage(conversationId, userId, content);
    sendSuccess(res, result, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/conversations/:id/regenerate
 * Re-plans the last AI reply from the last user message.
 */
export const regenerateReply = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.id);
    const result = await chatService.regenerateReply(conversationId, userId);
    sendSuccess(res, result, 'Reply regenerated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/chat/messages/:id
 * Edits a message inside a conversation owned by the user.
 */
export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const messageId = Number(req.params.id);
    const message = await messageService.editMessageForUser(messageId, userId, req.body.content);
    sendSuccess(res, message, 'Message updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/messages/:id
 * Deletes a message inside a conversation owned by the user.
 */
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const messageId = Number(req.params.id);
    await messageService.deleteMessageForUser(messageId, userId);
    sendSuccess(res, null, 'Message deleted successfully');
  } catch (error) {
    next(error);
  }
};
