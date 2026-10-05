/**
 * ===========================================
 *  Message Service
 * ===========================================
 *
 * Business logic for messages. Ownership is enforced
 * through the conversation: a user can only read/write
 * messages inside conversations they own.
 */

import { Transaction } from 'sequelize';
import { Conversation, Message, sequelize } from '../models';
import { MessageRole } from '../models/message.model';
import { AppError } from '../middlewares/error.middleware';
import { toMessagePayload } from '../utils/serializers';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for adding a message */
export interface AddMessageInput {
  role: MessageRole;
  content: string;
  metadata?: object | null;
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
 * Lists messages of a conversation owned by the user,
 * oldest first.
 */
export const listMessagesByConversation = async (
  conversationId: number,
  userId: number
): Promise<ReturnType<typeof toMessagePayload>[]> => {
  await findOwnedConversation(conversationId, userId);

  const messages = await Message.findAll({
    where: { conversation_id: conversationId },
    order: [['created_at', 'ASC']],
  });

  return messages.map(toMessagePayload);
};

/**
 * Adds a message to a conversation owned by the user and
 * touches the conversation's updated_at.
 */
export const addMessageToConversation = async (
  conversationId: number,
  userId: number,
  input: AddMessageInput
): Promise<ReturnType<typeof toMessagePayload>> => {
  return sequelize.transaction(async (transaction) => {
    await findOwnedConversation(conversationId, userId, transaction);

    const message = await Message.create(
      {
        conversation_id: conversationId,
        user_id: userId,
        role: input.role,
        content: input.content,
        metadata: input.metadata ?? null,
      },
      { transaction }
    );

    // Touch the conversation so it bubbles to the top of the list
    await Conversation.update(
      { updated_at: new Date() },
      { where: { id: conversationId }, transaction }
    );

    return toMessagePayload(message);
  });
};

/**
 * Edits a message inside a conversation owned by the user.
 */
export const editMessageForUser = async (
  messageId: number,
  userId: number,
  content: string
): Promise<ReturnType<typeof toMessagePayload>> => {
  return sequelize.transaction(async (transaction) => {
    const message = await Message.findOne({
      where: { id: messageId },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          where: { user_id: userId },
          required: true,
        },
      ],
      transaction,
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    await message.update({ content }, { transaction });

    return toMessagePayload(message);
  });
};

/**
 * Deletes a message inside a conversation owned by the user.
 */
export const deleteMessageForUser = async (
  messageId: number,
  userId: number
): Promise<void> => {
  return sequelize.transaction(async (transaction) => {
    const message = await Message.findOne({
      where: { id: messageId },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          where: { user_id: userId },
          required: true,
        },
      ],
      transaction,
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    await message.destroy({ transaction });
  });
};

/**
 * Returns the last message with the given role in a conversation.
 */
export const lastMessageInConversation = async (
  conversationId: number,
  role: MessageRole
): Promise<Message | null> => {
  return Message.findOne({
    where: { conversation_id: conversationId, role },
    order: [['created_at', 'DESC']],
  });
};

/**
 * Deletes the last message with the given role (used by regenerate).
 */
export const deleteLastMessageInConversation = async (
  conversationId: number,
  role: MessageRole
): Promise<void> => {
  const last = await lastMessageInConversation(conversationId, role);
  if (last) {
    await last.destroy();
  }
};
