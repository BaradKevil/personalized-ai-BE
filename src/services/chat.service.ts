/**
 * ===========================================
 *  Chat Service
 * ===========================================
 *
 * Orchestrates the chat flow:
 *
 *   Frontend → Chat API → Auth → Conversation ownership
 *   → Message storage → AI Service → Reply → Frontend
 *
 * The AI never touches the database directly — all data
 * flows through the business services, and every query
 * is scoped to the authenticated user.
 */

import { Message } from '../models';
import { User } from '../models';
import { Agent } from '../models';
import { Conversation } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { generateReply, AIReply } from './ai.service';
import * as messageService from './message.service';
import { logActivity } from './activity-log.service';

// -------------------------------------------------
//  Debug Logging (safe — never logs secrets/tokens)
// -------------------------------------------------

const logChat = (step: string, detail = '') => {
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`[Chat] ${step}${suffix}`);
};

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

/**
 * Loads the user + agent + recent history for a conversation.
 * All ownership checks happen inside the message service.
 */
const loadChatContext = async (
  conversationId: number,
  userId: number
): Promise<{ user: User; agent: Agent; history: { role: 'user' | 'agent'; content: string }[] }> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const agent = await Agent.findOne({ where: { user_id: userId } });
  if (!agent) {
    throw new AppError('Agent not found for this user', 404);
  }

  const recentMessages = await Message.findAll({
    where: { conversation_id: conversationId },
    order: [['created_at', 'ASC']],
    limit: 30,
  });

  // Only user/agent messages are sent to the AI
  const history = recentMessages
    .filter((m) => m.role === 'user' || m.role === 'agent')
    .map((m) => ({ role: m.role as 'user' | 'agent', content: m.content }));

  return { user, agent, history };
};

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Sends a user message and returns the AI reply.
 * The user message is persisted; the frontend persists
 * the final assistant message via a follow-up call.
 */
export const sendMessage = async (
  conversationId: number,
  userId: number,
  content: string
): Promise<{ reply: AIReply }> => {
  logChat('Request received', `conversation #${conversationId}`);

  // Persist the user message (ownership enforced inside)
  await messageService.addMessageToConversation(conversationId, userId, {
    role: 'user',
    content,
  });
  logChat('User message saved');

  // Auto-title: give a conversation a useful title from its first user message,
  // before the AI call so it applies even if the provider is unavailable.
  await autoTitleConversation(conversationId, userId, content);

  const { user, agent, history } = await loadChatContext(conversationId, userId);
  logChat('Conversation loaded', `history ${history.length} messages`);

  logChat('Sending request to AI provider');
  const reply = await generateReply(user, agent, history);
  logChat('AI response received');

  await logActivity({
    userId,
    actionPerformed: 'AI_MESSAGE_SENT',
    description: `AI replied in conversation #${conversationId}`,
  });
  logChat('Assistant reply ready');

  return { reply };
};

/**
 * Regenerates the last AI reply.
 * Deletes the previous agent message, then re-plans
 * from the last user message.
 */
export const regenerateReply = async (
  conversationId: number,
  userId: number
): Promise<{ reply: AIReply }> => {
  // Remove the previous AI reply so we re-plan from the user's message
  await messageService.deleteLastMessageInConversation(conversationId, 'agent');

  const lastUserMessage = await messageService.lastMessageInConversation(conversationId, 'user');
  if (!lastUserMessage) {
    throw new AppError('No user message to regenerate from', 400);
  }

  const { user, agent, history } = await loadChatContext(conversationId, userId);

  const reply = await generateReply(user, agent, history);

  await logActivity({
    userId,
    actionPerformed: 'AI_MESSAGE_REGENERATED',
    description: `AI reply regenerated in conversation #${conversationId}`,
  });

  return { reply };
};

/**
 * Generates a concise title from the first user message and
 * applies it once, so conversations in the sidebar aren't all
 * named "New conversation".
 */
const autoTitleConversation = async (
  conversationId: number,
  userId: number,
  content: string
): Promise<void> => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, user_id: userId },
  });
  if (!conversation || conversation.title !== 'New conversation') {
    return;
  }

  const words = content.trim().split(/\s+/).filter(Boolean);
  const title = words.slice(0, 6).join(' ');
  if (title.length < 3) {
    return;
  }

  await conversation.update({ title: title.length > 48 ? `${title.slice(0, 45)}...` : title });
  logChat('Conversation titled', `'${conversation.title}'`);
};
