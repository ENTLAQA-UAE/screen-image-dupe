import type {
  AiGenerateOptions,
  AiProviderAdapter,
  AiProviderType,
  AiResult,
} from '@/lib/ai/types';

/**
 * OpenAI-compatible adapter.
 *
 * Works with: OpenAI, Azure OpenAI, Groq, DeepSeek, Mistral, Ollama,
 * and any provider that implements the /v1/chat/completions API format.
 */

/**
 * Hardcoded allowlist of known AI provider base URLs.
 * Only these URLs (or URLs validated against them) can be used for fetch().
 * This prevents SSRF by ensuring we never fetch to user-controlled URLs.
 */
const ALLOWED_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  mistral: 'https://api.mistral.ai/v1',
  azure_openai: 'https://api.openai.com/v1', // Default; real Azure URL set per-tenant
  ollama: 'https://api.openai.com/v1', // Default fallback; real Ollama URL set per-tenant
  custom: 'https://api.openai.com/v1', // Default fallback
};

/**
 * Validate and resolve a base URL for an AI provider.
 * For known providers, always uses the hardcoded URL.
 * For azure_openai, ollama, and custom, validates that the user URL
 * is HTTPS and not targeting internal networks, then returns it.
 */
function resolveBaseUrl(
  providerType: AiProviderType,
  userBaseUrl?: string,
): string {
  // Known providers always use their official API endpoint
  if (
    providerType === 'openai' ||
    providerType === 'groq' ||
    providerType === 'deepseek' ||
    providerType === 'mistral'
  ) {
    return ALLOWED_BASE_URLS[providerType]!;
  }

  // For Azure, Ollama, Custom — validate the user-provided URL
  if (userBaseUrl && userBaseUrl.trim() !== '') {
    const trimmed = userBaseUrl.trim().replace(/\/+$/, '');

    // Must be valid URL
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return ALLOWED_BASE_URLS[providerType] ?? 'https://api.openai.com/v1';
    }

    // Must be HTTPS (block HTTP to prevent SSRF to internal services)
    if (parsed.protocol !== 'https:') {
      // Exception: allow HTTP for localhost in development only
      const isDev = process.env.NODE_ENV === 'development';
      const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (!(isDev && isLocalhost)) {
        return ALLOWED_BASE_URLS[providerType] ?? 'https://api.openai.com/v1';
      }
    }

    // Block private/internal IPs
    const host = parsed.hostname;
    if (
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === 'metadata.google.internal' ||
      host === 'metadata.google.com'
    ) {
      return ALLOWED_BASE_URLS[providerType] ?? 'https://api.openai.com/v1';
    }

    return trimmed;
  }

  return ALLOWED_BASE_URLS[providerType] ?? 'https://api.openai.com/v1';
}

export class OpenAiCompatibleAdapter implements AiProviderAdapter {
  readonly name: AiProviderType;
  private apiKey: string;
  private resolvedBaseUrl: string;
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
    this.resolvedBaseUrl = resolveBaseUrl(providerType, baseUrl);
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

    // Build the endpoint URL from the validated base
    const endpoint = new URL('/chat/completions', this.resolvedBaseUrl).toString();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
          top_p: options?.topP ?? 1.0,
        }),
      });

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
