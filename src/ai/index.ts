/**
 * ===========================================
 *  AI Provider Registry
 * ===========================================
 *
 * Registers available AI providers and selects the
 * active one from configuration. Adding a new provider
 * (e.g. Groq) means implementing AIChatProvider and
 * registering it here.
 */

import config from '../../config';
import { AIChatProvider, AIProviderError } from './types';
import { mockProvider } from './mock.provider';

// -------------------------------------------------
//  Provider Registry
// -------------------------------------------------

const providers: Record<string, AIChatProvider> = {
  mock: mockProvider,
};

// -------------------------------------------------
//  Factory
// -------------------------------------------------

/**
 * Returns the configured AI provider.
 *
 * The mock provider is ONLY used when explicitly configured
 * (AI_PROVIDER=mock). If Groq is configured but the API key is
 * missing, this throws — the chat layer surfaces a clear
 * user-safe message instead of silently returning fake replies.
 */
export const getProvider = (): AIChatProvider => {
  const configured = config.ai.provider;

  if (configured === 'gemini') {
    if (!config.ai.geminiApiKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AI Provider] GEMINI_API_KEY is not set. Falling back to mock provider in development.');
        return mockProvider;
      }
      throw new AIProviderError(
        'Milo\'s AI service is not configured yet. Add your GEMINI_API_KEY to backend/.env and restart the server.',
        'GEMINI_API_KEY is not set (AI_PROVIDER=gemini)',
        false
      );
    }
    // Lazy import to avoid loading provider code that needs the key at boot
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { geminiProvider } = require('./gemini.provider') as { geminiProvider: AIChatProvider };
    return geminiProvider;
  }

  if (configured === 'groq') {
    if (!config.ai.groqApiKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AI Provider] GROQ_API_KEY is not set. Falling back to mock provider in development.');
        return mockProvider;
      }
      throw new AIProviderError(
        'Milo\'s AI service is not configured yet. Add your GROQ_API_KEY to backend/.env and restart the server.',
        'GROQ_API_KEY is not set (AI_PROVIDER=groq)',
        false
      );
    }
    // Lazy import to avoid loading provider code that needs the key at boot
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { groqProvider } = require('./groq.provider') as { groqProvider: AIChatProvider };
    return groqProvider;
  }

  return providers[configured] || mockProvider;
};
