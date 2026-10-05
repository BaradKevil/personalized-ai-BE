/**
 * ===========================================
 *  AI Provider Types
 * ===========================================
 *
 * Shared types for the AI provider abstraction.
 * New providers (Groq, others) implement the
 * AIChatProvider interface and are registered in
 * src/ai/index.ts.
 */

/** A single message in the conversation history sent to the provider */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Options passed to a provider's chat() method */
export interface AIChatOptions {
  /** System prompt (Novi personality + instructions) */
  system: string;
  /** Conversation messages (history + latest user message) */
  messages: AIMessage[];
  /** Optional request timeout in milliseconds */
  timeoutMs?: number;
}

/** The AI provider contract */
export interface AIChatProvider {
  readonly name: string;
  /** Generates a chat completion. Throws AIProviderError on failure. */
  chat(options: AIChatOptions): Promise<string>;
}

/**
 * Error thrown by AI providers when the provider is
 * unavailable, rate-limited, timed out, or malformed.
 * Carries a user-safe message and technical detail
 * for server-side logging.
 */
export class AIProviderError extends Error {
  public readonly userMessage: string;
  public readonly retriable: boolean;

  constructor(userMessage: string, detail: string, retriable = true) {
    super(detail);
    this.name = 'AIProviderError';
    this.userMessage = userMessage;
    this.retriable = retriable;
  }
}
