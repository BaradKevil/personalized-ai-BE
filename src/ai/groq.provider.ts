/**
 * ===========================================
 *  Groq AI Provider
 * ===========================================
 *
 * Calls the Groq chat completions API.
 *
 * Error handling:
 *  - Rate limits / provider errors become AIProviderError
 *    with a user-safe message (technical detail logged server-side).
 *  - Limited exponential backoff (max 3 attempts) for retriable
 *    errors; never retries infinitely.
 */

import config from '../../config';
import { AIChatOptions, AIChatProvider, AIProviderError } from './types';

// -------------------------------------------------
//  Constants
// -------------------------------------------------

/** Maximum attempts for retriable failures (rate limit, 5xx) */
const MAX_ATTEMPTS = 3;

/** Base delay for exponential backoff (ms) */
const BASE_BACKOFF_MS = 500;

/** Request timeout (ms) */
const DEFAULT_TIMEOUT_MS = 30000;

/** User-safe message shown when the provider cannot respond */
const UNAVAILABLE_MESSAGE = 'Novi is temporarily unable to respond. Please try again.';

// -------------------------------------------------
//  Helpers
// -------------------------------------------------

/** Small sleep helper for backoff */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends one chat completion request to Groq.
 */
const callGroq = async (options: AIChatOptions): Promise<string> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ai.groqApiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.groqModel,
        messages: [
          { role: 'system', content: options.system },
          ...options.messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = `Groq API error ${response.status}: ${await response.text()}`;
      console.error(`❌ [AI Provider] ${detail}`);
      if (response.status === 429) {
        throw new AIProviderError(
          'Novi is a little busy right now. Please try again in a moment.',
          `Groq rate limited (429): ${detail}`,
          true
        );
      }
      if (response.status >= 500) {
        throw new AIProviderError(UNAVAILABLE_MESSAGE, `Groq server error: ${detail}`, true);
      }
      throw new AIProviderError(UNAVAILABLE_MESSAGE, detail, false);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data?.choices?.[0]?.message?.content;

    if (typeof reply !== 'string' || reply.trim().length === 0) {
      throw new AIProviderError(UNAVAILABLE_MESSAGE, 'Malformed Groq response: empty content', false);
    }

    return reply.trim();
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw error;
    }
    if ((error as Error).name === 'AbortError') {
      throw new AIProviderError(UNAVAILABLE_MESSAGE, `Groq request timed out after ${timeoutMs}ms`, true);
    }
    throw new AIProviderError(UNAVAILABLE_MESSAGE, `Groq request failed: ${(error as Error).message}`, true);
  } finally {
    clearTimeout(timer);
  }
};

export const groqProvider: AIChatProvider = {
  name: 'groq',

  chat: async (options: AIChatOptions): Promise<string> => {
    let attempt = 1;

    while (attempt <= MAX_ATTEMPTS) {
      try {
        return await callGroq(options);
      } catch (error) {
        const isRetriable = error instanceof AIProviderError && error.retriable;

        if (!isRetriable || attempt === MAX_ATTEMPTS) {
          // Log technical detail server-side; surface only the safe message
          console.error(`❌ [AI Provider] ${(error as Error).message}`);
          throw new AIProviderError(
            error instanceof AIProviderError ? error.userMessage : UNAVAILABLE_MESSAGE,
            (error as Error).message,
            false
          );
        }

        // Exponential backoff with jitter, then retry
        const delayMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
        console.warn(`⚠️  [AI Provider] Retry ${attempt}/${MAX_ATTEMPTS} in ${delayMs}ms`);
        await sleep(delayMs);
        attempt += 1;
      }
    }

    throw new AIProviderError(UNAVAILABLE_MESSAGE, 'Groq provider exhausted retries', false);
  },
};
