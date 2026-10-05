/**
 * ===========================================
 *  Gemini AI Provider
 * ===========================================
 *
 * Calls the Google Gemini Generative Language API (v1beta).
 *
 * Error handling:
 *  - Rate limits (429) and high-demand spikes (503) become retriable AIProviderError
 *  - Automatic fallback models (gemini-flash-lite-latest <-> gemini-flash-latest)
 *  - Exponential backoff with jitter (max 3 attempts)
 *  - Clean extraction of reply text and candidate responses
 */

import config from '../../config';
import { AIChatOptions, AIChatProvider, AIProviderError } from './types';

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 600;
const DEFAULT_TIMEOUT_MS = 35000;
const UNAVAILABLE_MESSAGE = 'Milo is temporarily unable to respond. Please try again.';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
];

const callGemini = async (options: AIChatOptions, modelName: string): Promise<string> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 1. Separate system instructions and user/model chat turns
    const systemParts: string[] = [];
    if (options.system && options.system.trim()) {
      systemParts.push(options.system.trim());
    }

    const rawContents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    for (const msg of options.messages) {
      if (msg.role === 'system') {
        const text = msg.content?.trim();
        if (text) systemParts.push(text);
      } else {
        const text = msg.content?.trim() || '';
        if (text) {
          rawContents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text }],
          });
        }
      }
    }

    // Merge consecutive messages with the same role (Gemini requires alternating roles)
    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const item of rawContents) {
      const prev = contents[contents.length - 1];
      if (prev && prev.role === item.role) {
        prev.parts[0].text += `\n\n${item.parts[0].text}`;
      } else {
        contents.push({ ...item });
      }
    }

    // If contents starts with a model message, prepend a brief user placeholder
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    // If contents is empty, ensure at least one turn
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const requestBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    if (systemParts.length > 0) {
      requestBody.systemInstruction = {
        parts: [{ text: systemParts.join('\n\n') }],
      };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.ai.geminiApiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const rawErrorText = await response.text();
      let errorJson: { error?: { message?: string; status?: string; code?: number } } | null = null;
      try {
        errorJson = JSON.parse(rawErrorText);
      } catch {
        // ignore parse error
      }
      const apiMessage = errorJson?.error?.message || rawErrorText;
      const detail = `Gemini API error ${response.status} (${modelName}): ${apiMessage}`;
      console.error(`❌ [AI Provider] ${detail}`);

      if (response.status === 429) {
        throw new AIProviderError(
          'Milo is a little busy right now. Please try again in a moment.',
          `Gemini rate limited (429): ${detail}`,
          true
        );
      }
      if (response.status >= 500 || response.status === 503) {
        throw new AIProviderError(UNAVAILABLE_MESSAGE, `Gemini server error: ${detail}`, true);
      }
      if (response.status === 404) {
        throw new AIProviderError(UNAVAILABLE_MESSAGE, `Gemini model not found (404): ${detail}`, true);
      }
      throw new AIProviderError(UNAVAILABLE_MESSAGE, detail, false);
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: {
          parts?: { text?: string }[];
        };
        finishReason?: string;
      }[];
    };

    const firstCandidate = data?.candidates?.[0];
    const candidateParts = firstCandidate?.content?.parts;
    const replyText = candidateParts
      ?.map((p) => p.text || '')
      .join('')
      .trim();

    if (!replyText) {
      if (firstCandidate?.finishReason === 'SAFETY') {
        throw new AIProviderError(
          'I cannot generate a response for this request due to safety policies.',
          'Gemini response blocked by safety filters',
          false
        );
      }
      throw new AIProviderError(UNAVAILABLE_MESSAGE, 'Malformed Gemini response: empty content', false);
    }

    return replyText;
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw error;
    }
    if ((error as Error).name === 'AbortError') {
      throw new AIProviderError(UNAVAILABLE_MESSAGE, `Gemini request timed out after ${timeoutMs}ms`, true);
    }
    throw new AIProviderError(UNAVAILABLE_MESSAGE, `Gemini request failed: ${(error as Error).message}`, true);
  } finally {
    clearTimeout(timer);
  }
};

export const geminiProvider: AIChatProvider = {
  name: 'gemini',

  chat: async (options: AIChatOptions): Promise<string> => {
    let attempt = 1;
    let currentModel = config.ai.geminiModel;

    while (attempt <= MAX_ATTEMPTS) {
      try {
        return await callGemini(options, currentModel);
      } catch (error) {
        const isRetriable = error instanceof AIProviderError && error.retriable;

        if (!isRetriable || attempt === MAX_ATTEMPTS) {
          console.error(`❌ [AI Provider] ${(error as Error).message}`);
          throw new AIProviderError(
            error instanceof AIProviderError ? error.userMessage : UNAVAILABLE_MESSAGE,
            (error as Error).message,
            false
          );
        }

        const nextFallback = FALLBACK_MODELS.find((m) => m !== currentModel);
        if (nextFallback) {
          console.warn(`🔄 [AI Provider] Model ${currentModel} returned retriable error. Trying fallback model: ${nextFallback}`);
          currentModel = nextFallback;
        }

        const delayMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
        console.warn(`⚠️  [AI Provider] Retry ${attempt}/${MAX_ATTEMPTS} in ${delayMs}ms`);
        await sleep(delayMs);
        attempt += 1;
      }
    }

    throw new AIProviderError(UNAVAILABLE_MESSAGE, 'Gemini provider exhausted retries', false);
  },
};
