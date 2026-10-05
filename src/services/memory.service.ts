/**
 * ===========================================
 *  Memory Service
 * ===========================================
 *
 * Business logic for the user's personal memory.
 * The user owns their memory — every operation is
 * scoped to the authenticated user and supports
 * create / list / search / update / delete / forget.
 */

import { Op, Transaction } from 'sequelize';
import { Memory, sequelize } from '../models';
import { MemoryImportance } from '../models/memory.model';
import { AppError } from '../middlewares/error.middleware';
import { toMemoryPayload } from '../utils/serializers';
import { logActivity } from './activity-log.service';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for creating a memory (camelCase API contract) */
export interface CreateMemoryInput {
  category?: string;
  content: string;
  importance?: MemoryImportance;
  source?: string;
}

/** Input for updating a memory */
export interface UpdateMemoryInput {
  category?: string;
  content?: string;
  importance?: MemoryImportance;
}

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

/**
 * Loads a memory only if it belongs to the given user.
 * Throws 404 otherwise — never leaks another user's memory.
 */
const findOwnedMemory = async (
  memoryId: number,
  userId: number,
  transaction?: Transaction
): Promise<Memory> => {
  const memory = await Memory.findOne({
    where: { id: memoryId, user_id: userId },
    transaction,
  });

  if (!memory) {
    throw new AppError('Memory not found', 404);
  }

  return memory;
};

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Lists the user's memories, most recently updated first.
 * Optional free-text search across content and category.
 */
export const listMemoriesByUser = async (
  userId: number,
  search?: string
): Promise<ReturnType<typeof toMemoryPayload>[]> => {
  const where: any = { user_id: userId };

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { content: { [Op.like]: term } },
      { type: { [Op.like]: term } },
    ];
  }

  const memories = await Memory.findAll({
    where,
    order: [['updated_at', 'DESC']],
  });

  return memories.map(toMemoryPayload);
};

/**
 * Creates a memory for the user.
 */
export const createMemoryForUser = async (
  userId: number,
  input: CreateMemoryInput
): Promise<ReturnType<typeof toMemoryPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const memory = await Memory.create(
      {
        user_id: userId,
        type: input.category?.trim() || 'General',
        content: input.content,
        importance: input.importance ?? 'medium',
        source: input.source ?? null,
      },
      { transaction }
    );

    await logActivity({
      userId,
      actionPerformed: 'MEMORY_CREATED',
      description: `Memory created: '${input.content.slice(0, 80)}'`,
      transaction,
    });

    return toMemoryPayload(memory);
  });
};

/**
 * Updates a memory owned by the user.
 */
export const updateMemoryForUser = async (
  memoryId: number,
  userId: number,
  input: UpdateMemoryInput
): Promise<ReturnType<typeof toMemoryPayload>> => {
  return sequelize.transaction(async (transaction) => {
    const memory = await findOwnedMemory(memoryId, userId, transaction);

    await memory.update(
      {
        ...(input.category !== undefined && { type: input.category }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.importance !== undefined && { importance: input.importance }),
      },
      { transaction }
    );

    return toMemoryPayload(memory);
  });
};

/**
 * Deletes ("forgets") a memory owned by the user.
 */
export const deleteMemoryForUser = async (
  memoryId: number,
  userId: number
): Promise<void> => {
  return sequelize.transaction(async (transaction) => {
    const memory = await findOwnedMemory(memoryId, userId, transaction);

    await memory.destroy({ transaction });

    await logActivity({
      userId,
      actionPerformed: 'MEMORY_DELETED',
      description: `Memory forgotten: '${memory.content.slice(0, 80)}'`,
      transaction,
    });
  });
};
