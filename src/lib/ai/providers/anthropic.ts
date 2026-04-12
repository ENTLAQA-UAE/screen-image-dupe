import type {
  AiGenerateOptions,
  AiProviderAdapter,
  AiResult,
} from '@/lib/ai/types';

/**
 * Anthropic Messages API adapter.
 * @see https://docs.anthropic.com/en/api/messages
 */
export class AnthropicAdapter implements AiProviderAdapter {
  readonly name = 'anthropic' as const;
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async generate(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: AiGenerateOptions,
  ): Promise<AiResult> {
    const model = options?.model ?? this.defaultModel;
    const startTime = Date.now();

    // Anthropic separates system from messages
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: options?.maxTokens ?? 4096,
          temperature: options?.temperature ?? 0.7,
          top_p: options?.topP ?? 1.0,
          system: systemMsg?.content,
          messages: chatMessages,
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
            `Anthropic API error: ${response.status}`,
        };
      }

      const data = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
        };
        model?: string;
      };

      const text =
        data.content?.find((c) => c.type === 'text')?.text ?? '';
      const usage = data.usage;

      return {
        success: true,
        text,
        promptTokens: usage?.input_tokens ?? 0,
        completionTokens: usage?.output_tokens ?? 0,
        totalTokens:
          (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0),
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
