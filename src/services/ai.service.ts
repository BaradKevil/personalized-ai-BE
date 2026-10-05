/**
 * ===========================================
 *  AI Service
 * ===========================================
 *
 * The single gateway between business logic and the
 * AI provider. Controllers never call the provider
 * directly — they go through this service, which:
 *
 *  1. Loads the agent (personality overrides)
 *  2. Builds the system prompt (centralized)
 *  3. Builds bounded context from user-owned data
 *  4. Calls the configured provider (mock or Groq)
 *  5. Returns a validated reply
 */

import { AIProviderError } from '../ai/types';
import { getProvider } from '../ai';
import { buildSystemPrompt } from '../ai/prompts';
import { buildChatContext } from '../ai/context';
import { extractAction, executeAction } from '../ai/actions';
import { Agent, User } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logActivity } from './activity-log.service';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** Reply payload returned to the frontend */
export interface AIReply {
  text: string;
  actions: unknown[];
}

// -------------------------------------------------
//  Service Methods
// -------------------------------------------------

/**
 * Generates an AI reply for a conversation.
 *
 * @param user - The owning user (never another user's data)
 * @param agent - The user's agent (personality overrides)
 * @param history - Recent user/agent messages, oldest first
 * @returns The AI reply text
 */
export const generateReply = async (
  user: User,
  agent: Agent,
  history: { role: 'user' | 'agent'; content: string }[]
): Promise<AIReply> => {
  const system = buildSystemPrompt(agent);
  const messages = buildChatContext(user, history);

  let text: string;
  try {
    // Provider selection can throw (e.g. Groq configured without a key) —
    // that must surface as a clean 503, not a raw 500.
    const provider = getProvider();
    text = await provider.chat({ system, messages });
  } catch (error) {
    if (error instanceof AIProviderError) {
      // User-safe message; technical detail already logged by the provider
      await logActivity({
        userId: user.id,
        actionPerformed: 'AI_PROVIDER_FAILURE',
        description: error.message,
        status: 'failed',
      });
      throw new AppError(error.userMessage, 503);
    }
    throw error;
  }

  // Graceful failure if the provider returns an empty reply
  if (!text || text.trim().length === 0) {
    throw new AppError('Milo is temporarily unable to respond. Please try again.', 503);
  }

  // ---- AI Action Layer ----
  // If the model asked for a concrete, supported action, execute it
  // through the real business services and use the confirmation as
  // the assistant reply. If the action fails, an honest explanation
  // is returned instead of a fabricated success.
  const action = extractAction(text);
  if (action) {
    const result = await executeAction(action, user.id);
    if (!result.ok) {
      await logActivity({
        userId: user.id,
        actionPerformed: 'AI_ACTION_REJECTED',
        description: `Action '${action.action}' rejected: ${result.text.slice(0, 120)}`,
        status: 'failed',
      });
    } else {
      await logActivity({
        userId: user.id,
        actionPerformed: 'AI_ACTION_EXECUTED',
        description: `Action '${action.action}' executed successfully`,
      });
    }
    text = result.text;
  }

  return { text, actions: [] };
};
