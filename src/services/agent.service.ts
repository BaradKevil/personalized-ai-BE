/**
 * ===========================================
 *  Agent Service
 * ===========================================
 *
 * Business logic for the user's personal AI agent.
 * Every user owns exactly one agent (default "Novi").
 */

import { Transaction } from 'sequelize';
import { Agent, sequelize } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { toAgentPayload } from '../utils/serializers';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Input for updating the agent (camelCase API contract) */
export interface UpdateAgentInput {
  name?: string;
  avatar?: string;
  color?: string;
  personality?: string;
}

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Retrieves the personal agent for a user.
 * Throws 404 if the agent has not been provisioned.
 *
 * @param userId - The ID of the owning user
 * @param transaction - Optional Sequelize Transaction
 */
export const getAgentByUserId = async (
  userId: number,
  transaction?: Transaction
): Promise<ReturnType<typeof toAgentPayload>> => {
  const agent = await Agent.findOne({
    where: { user_id: userId },
    transaction,
  });

  if (!agent) {
    throw new AppError('Agent not found for this user', 404);
  }

  return toAgentPayload(agent);
};

/**
 * Updates the user's personal agent.
 *
 * @param userId - The ID of the owning user (ownership enforced here)
 * @param input - Agent update fields (camelCase)
 * @param externalTransaction - Optional external transaction to join
 */
export const updateAgentByUserId = async (
  userId: number,
  input: UpdateAgentInput,
  externalTransaction?: Transaction
): Promise<ReturnType<typeof toAgentPayload>> => {
  const executeUpdate = async (transaction: Transaction) => {
    const agent = await Agent.findOne({
      where: { user_id: userId },
      transaction,
    });

    if (!agent) {
      throw new AppError('Agent not found for this user', 404);
    }

    await agent.update(input, { transaction });

    return toAgentPayload(agent);
  };

  if (externalTransaction) {
    return executeUpdate(externalTransaction);
  }

  return sequelize.transaction(executeUpdate);
};
