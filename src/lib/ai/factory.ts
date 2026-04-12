import type { AiProviderAdapter, AiProviderConfig } from '@/lib/ai/types';

/**
 * Create an AI provider adapter from configuration.
 *
 * Key insight: OpenAI, Azure, Groq, DeepSeek, Mistral, and Ollama all
 * use the same /v1/chat/completions API format. Only the base URL and
 * model name differ. So we only need 3 actual implementations.
 */
export async function createAiProvider(
  config: AiProviderConfig,
): Promise<AiProviderAdapter> {
  switch (config.providerType) {
    case 'openai':
    case 'azure_openai':
    case 'groq':
    case 'deepseek':
    case 'mistral':
    case 'ollama':
    case 'custom': {
      const { OpenAiCompatibleAdapter } = await import(
        '@/lib/ai/providers/openai-compatible'
      );
      return new OpenAiCompatibleAdapter(
        config.providerType,
        config.apiKey,
        config.defaultModel,
        config.baseUrl,
        config.organizationHeader,
      );
    }

    case 'anthropic': {
      const { AnthropicAdapter } = await import(
        '@/lib/ai/providers/anthropic'
      );
      return new AnthropicAdapter(config.apiKey, config.defaultModel);
    }

    case 'gemini': {
      const { GeminiAdapter } = await import(
        '@/lib/ai/providers/gemini'
      );
      return new GeminiAdapter(config.apiKey, config.defaultModel);
    }

    default:
      throw new Error(`Unknown AI provider: ${config.providerType}`);
  }
}
