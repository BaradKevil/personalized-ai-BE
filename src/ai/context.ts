/**
 * ===========================================
 *  AI Context Builder
 * ===========================================
 *
 * Builds the compact, relevant context sent to the AI
 * provider. Only the user's OWN data is ever included —
 * never another user's records.
 *
 * Phase 4: user profile + limited recent history.
 * Later phases add tasks, goals, and memories through
 * the same builder (still bounded and selective).
 */

import { AIMessage } from './types';
import User from '../models/user.model';
import Agent from '../models/agent.model';

// -------------------------------------------------
//  Limits (token / context management)
// -------------------------------------------------

/** Maximum number of recent messages sent to the provider */
export const MAX_HISTORY_MESSAGES = 20;

// -------------------------------------------------
//  Context Building
// -------------------------------------------------

/**
 * Builds the conversation messages for the provider:
 *  1. A compact user-profile header (as a system-role message)
 *  2. The most recent conversation history (bounded)
 *
 * @param user - The owning user (profile facts only)
 * @param history - Recent messages, oldest first (already user-owned)
 */
export const buildChatContext = (
  user: User,
  history: { role: 'user' | 'agent'; content: string }[],
): AIMessage[] => {
  const profileLines = [
    `User profile (private, do not repeat verbatim):`,
    `- Name: ${user.full_name}`,
    user.timezone ? `- Timezone: ${user.timezone}` : '',
  ].filter(Boolean);

  const messages: AIMessage[] = [
    { role: 'system', content: profileLines.join('\n') },
  ];

  // Bounded history — only the most recent messages
  const recent = history.slice(-MAX_HISTORY_MESSAGES);

  for (const message of recent) {
    messages.push({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
    });
  }

  return messages;
};
