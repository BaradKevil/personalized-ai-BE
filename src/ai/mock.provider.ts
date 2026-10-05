/**
 * ===========================================
 *  Mock AI Provider (Explicit Development Mode)
 * ===========================================
 *
 * Deterministic local responder used ONLY when the server is
 * explicitly started with AI_PROVIDER=mock. It is never used
 * as a silent fallback — if Groq is configured without a key,
 * the provider factory throws instead (see src/ai/index.ts).
 *
 * Every reply is clearly labeled as a demo so it can never be
 * mistaken for a real AI response.
 */

import { AIChatProvider, AIChatOptions } from './types';

const lower = (s: string) => s.toLowerCase();

/**
 * Simple deterministic responder for explicit demo mode.
 * Every reply is clearly marked as a demo response.
 */
const respond = (options: AIChatOptions): string => {
  const last = options.messages[options.messages.length - 1];
  const text = last?.content?.trim() || '';

  const t = lower(text);

  // Capabilities
  if (/(what can you do|help|how do you work|capabilities)/.test(t)) {
    return [
      '*[Demo mode — no AI connected]*',
      '',
      'When Groq is connected (add GROQ_API_KEY to backend/.env), I can help you:',
      '',
      '- **Plan your day** — ask me what to focus on',
      '- **Tasks** — "remind me to call Rahul tomorrow at 11"',
      '- **Memory** — "remember that I prefer morning meetings"',
      '- **Goals** — tell me what you are working toward',
      '',
      'Right now, with AI_PROVIDER=mock, every reply is a local demo.',
    ].join('\n');
  }

  // Fallback — clearly a demo, never pretends to be real
  return `*[Demo mode — no AI connected]* I am running as a local demo. Add your GROQ_API_KEY to backend/.env and restart the server to talk to the real AI.`;
};

export const mockProvider: AIChatProvider = {
  name: 'mock',

  chat: async (options: AIChatOptions): Promise<string> => {
    // Simulate a small latency so the UI streaming feels realistic
    await new Promise((resolve) => setTimeout(resolve, 250));
    return respond(options);
  },
};
