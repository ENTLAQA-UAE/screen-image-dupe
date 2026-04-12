import type {
  AiGenerateOptions,
  AiProviderAdapter,
  AiResult,
} from '@/lib/ai/types';

/**
 * Google Gemini (Generative AI) adapter.
 * @see https://ai.google.dev/gemini-api/docs/text-generation
 */
export class GeminiAdapter implements AiProviderAdapter {
  readonly name = 'gemini' as const;
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'gemini-2.5-flash') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async generate(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: AiGenerateOptions,
  ): Promise<AiResult> {
    const model = options?.model ?? this.defaultModel;
    const startTime = Date.now();

    // Convert chat format to Gemini format
    const systemMsg = messages.find((m) => m.role === 'system');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: systemMsg
              ? { parts: [{ text: systemMsg.content }] }
              : undefined,
            generationConfig: {
              temperature: options?.temperature ?? 0.7,
              maxOutputTokens: options?.maxTokens ?? 4096,
              topP: options?.topP ?? 1.0,
            },
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
            body.error?.message ?? `Gemini API error: ${response.status}`,
        };
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const usage = data.usageMetadata;

      return {
        success: true,
        text,
        promptTokens: usage?.promptTokenCount ?? 0,
        completionTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
        model,
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
