import type {
  AiGenerateOptions,
  AiProviderAdapter,
  AiProviderType,
  AiResult,
} from '@/lib/ai/types';
import { validateAiBaseUrl } from '@/lib/ai/url-validator';

/**
 * OpenAI-compatible adapter.
 *
 * Works with: OpenAI, Azure OpenAI, Groq, DeepSeek, Mistral, Ollama,
 * and any provider that implements the /v1/chat/completions API format.
 *
 * Only the base URL and model name differ between providers.
 */

const DEFAULT_BASE_URLS: Partial<Record<AiProviderType, string>> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  mistral: 'https://api.mistral.ai/v1',
  ollama: 'http://localhost:11434/v1',
};

export class OpenAiCompatibleAdapter implements AiProviderAdapter {
  readonly name: AiProviderType;
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private orgHeader?: string;

  constructor(
    providerType: AiProviderType,
    apiKey: string,
    defaultModel: string,
    baseUrl?: string,
    orgHeader?: string,
  ) {
    this.name = providerType;
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    const candidateUrl =
      baseUrl ?? DEFAULT_BASE_URLS[providerType] ?? 'https://api.openai.com/v1';
    const validation = validateAiBaseUrl(candidateUrl);
    if (!validation.valid) {
      throw new Error(`Invalid base URL: ${validation.error}`);
    }
    this.baseUrl = validation.sanitized ?? candidateUrl;
    this.orgHeader = orgHeader;
  }

  async generate(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: AiGenerateOptions,
  ): Promise<AiResult> {
    const model = options?.model ?? this.defaultModel;
    const startTime = Date.now();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (this.orgHeader) {
      headers['OpenAI-Organization'] = this.orgHeader;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096,
            top_p: options?.topP ?? 1.0,
          }),
        },
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        return {
          success: false,
          latencyMs,
          model,
          error:
            body.error?.message ??
            `${this.name} API error: ${response.status}`,
        };
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
        model?: string;
      };

      const text = data.choices?.[0]?.message?.content ?? '';
      const usage = data.usage;

      return {
        success: true,
        text,
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        model: data.model ?? model,
        latencyMs,
      };
    } catch (err) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        model,
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      const result = await this.generate(
        [{ role: 'user', content: 'Say "ok"' }],
        { maxTokens: 5 },
      );
      return result.success;
    } catch {
      return false;
    }
  }
}
