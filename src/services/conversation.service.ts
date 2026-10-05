/**
 * ===========================================
 *  Conversation Service
 * ===========================================
 *
 * Business logic for conversations. Every conversation
 * belongs to exactly one user — ownership is enforced
 * in every operation. The authenticated user ID always
 * comes from the JWT, never from the request body.
 */

import { Transaction } from 'sequelize';
import { Agent, Conversation, sequelize } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { toConversationPayload } from '../utils/serializers';
import { logActivity } from './activity-log.service';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for creating a conversation */
export interface CreateConversationInput {
  title?: string;
}

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

/**
 * Loads a conversation only if it belongs to the given user.
 * Throws 404 otherwise — never leaks another user's data.
 */
const findOwnedConversation = async (
  conversationId: number,
  userId: number,
  transaction?: Transaction
): Promise<Conversation> => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, user_id: userId },
    transaction,
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  return conversation;
};

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Lists the authenticated user's conversations,
 * most recently updated first.
 */
export const listConversationsByUser = async (
  userId: number
): Promise<ReturnType<typeof toConversationPayload>[]> => {
  const conversations = await Conversation.findAll({
    where: { user_id: userId },
    order: [['updated_at', 'DESC']],
  });

  return conversations.map(toConversationPayload);
};

/**
 * Creates a new conversation for the user's agent.
 */
export const createConversationForUser = async (
  userId: number,
  input: CreateConversationInput
): Promise<ReturnType<typeof toConversationPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const agent = await Agent.findOne({
      where: { user_id: userId },
      transaction,
    });
    if (!agent) {
      throw new AppError('Agent not found for this user', 404);
    }

    const conversation = await Conversation.create(
      {
        user_id: userId,
        agent_id: agent.id,
        title: input.title?.trim() || 'New conversation',
      },
      { transaction }
    );

    await logActivity({
      userId,
      actionPerformed: 'CONVERSATION_CREATED',
      description: `User created conversation '${conversation.title}'`,
      transaction,
    });

    return toConversationPayload(conversation);
  });
};

/**
 * Renames a conversation owned by the user.
 */
export const renameConversationForUser = async (
  conversationId: number,
  userId: number,
  title: string
): Promise<ReturnType<typeof toConversationPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const conversation = await findOwnedConversation(conversationId, userId, transaction);

    await conversation.update({ title: title.trim() }, { transaction });

    return toConversationPayload(conversation);
  });
};

/**
 * Deletes a conversation (and its messages via CASCADE).
 * Ownership is enforced.
 */
export const deleteConversationForUser = async (
  conversationId: number,
  userId: number
): Promise<void> => {
  return sequelize.transaction(async (transaction) => {
    const conversation = await findOwnedConversation(conversationId, userId, transaction);

    await conversation.destroy({ transaction });

    await logActivity({
      userId,
      actionPerformed: 'CONVERSATION_DELETED',
      description: `User deleted conversation '${conversation.title}'`,
      transaction,
    });
  });
};
