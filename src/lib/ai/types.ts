/**
 * AI provider adapter interface.
 *
 * All AI providers implement this interface so the rest of the app
 * doesn't care which provider the tenant configured.
 */

export type AiProviderType =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'azure_openai'
  | 'groq'
  | 'deepseek'
  | 'mistral'
  | 'ollama'
  | 'custom';

export type AiUseCase =
  | 'question_generation'
  | 'narrative'
  | 'snapshot'
  | 'group_insights'
  | 'test';

export interface AiGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
}

export interface AiResult {
  success: boolean;
  text?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  model?: string;
  latencyMs?: number;
  error?: string;
}

export interface AiProviderAdapter {
  readonly name: AiProviderType;

  /**
   * Generate text from a prompt using the chat completions format.
   */
  generate(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: AiGenerateOptions,
  ): Promise<AiResult>;

  /**
   * Verify the API key is valid.
   */
  verifyCredentials(): Promise<boolean>;
}

/**
 * Configuration needed to instantiate any AI provider.
 */
export interface AiProviderConfig {
  providerType: AiProviderType;
  apiKey: string;
  baseUrl?: string;
  organizationHeader?: string;
  defaultModel: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Approximate cost per 1M tokens by provider/model.
 * Used for cost estimation in usage tracking.
 */
export const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'o1': { input: 15, output: 60 },
  'o1-mini': { input: 3, output: 12 },
  // Anthropic
  'claude-opus-4-20250514': { input: 15, output: 75 },
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4 },
  // Google
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  // Groq
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
  // DeepSeek
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
  // Mistral
  'mistral-large-latest': { input: 2, output: 6 },
  'mistral-small-latest': { input: 0.2, output: 0.6 },
};

/**
 * Estimate cost in USD for a given model and token counts.
 */
export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const costs = TOKEN_COSTS[model];
  if (!costs) return 0;
  return (
    (promptTokens / 1_000_000) * costs.input +
    (completionTokens / 1_000_000) * costs.output
  );
}
