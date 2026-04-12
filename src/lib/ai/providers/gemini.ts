import type {
  AiGenerateOptions,
  AiProviderAdapter,
  AiResult,
} from '@/lib/ai/types';

/**
 * Google Gemini (Generative AI) adapter.
 * @see https://ai.google.dev/gemini-api/docs/text-generation
 *
 * SSRF protection: The fetch URL is constructed entirely from hardcoded
 * constants. The model name is resolved via an allowlist — if the
 * requested model is not in the list, we default to gemini-2.5-flash.
 * No user-provided data ever reaches the URL.
 */

/**
 * Allowlist of Gemini model names → their full hardcoded API endpoints.
 * This is the ONLY place that defines valid Gemini URLs.
 * No user input is interpolated into any URL.
 */
const GEMINI_ENDPOINTS: Record<string, string> = {
  'gemini-2.5-flash': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  'gemini-2.5-pro': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
  'gemini-2.0-flash': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  'gemini-1.5-flash': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  'gemini-1.5-pro': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
};

const DEFAULT_ENDPOINT = GEMINI_ENDPOINTS['gemini-2.5-flash']!;

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
    const requestedModel = options?.model ?? this.defaultModel;
    const startTime = Date.now();

    // Resolve to a hardcoded endpoint — no user data in the URL
    const endpoint = GEMINI_ENDPOINTS[requestedModel] ?? DEFAULT_ENDPOINT;
    const actualModel = GEMINI_ENDPOINTS[requestedModel]
      ? requestedModel
      : 'gemini-2.5-flash';

    // Convert chat format to Gemini format
    const systemMsg = messages.find((m) => m.role === 'system');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    try {
      // endpoint is always from GEMINI_ENDPOINTS (hardcoded constant)
      const fetchUrl = `${endpoint}?key=${encodeURIComponent(this.apiKey)}`;

      const response = await fetch(fetchUrl, {
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
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        return {
          success: false,
          latencyMs,
          model: actualModel,
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
        model: actualModel,
        latencyMs,
      };
    } catch (err) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        model: actualModel,
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
