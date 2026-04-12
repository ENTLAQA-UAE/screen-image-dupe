import 'server-only';

import { createAiProvider } from '@/lib/ai/factory';
import type {
  AiProviderConfig,
  AiProviderType,
  AiResult,
  AiUseCase,
} from '@/lib/ai/types';
import { estimateCost } from '@/lib/ai/types';
import { createAdminClient } from '@/lib/supabase/server';
import { rpc } from '@/lib/supabase/types';

/**
 * High-level AI service.
 *
 * Loads the tenant's configured AI provider, checks usage caps,
 * calls the adapter, logs usage, and returns the result.
 *
 * Usage:
 *   import { generateAi } from '@/lib/ai/service';
 *   const result = await generateAi(orgId, 'question_generation', [
 *     { role: 'system', content: '...' },
 *     { role: 'user', content: '...' },
 *   ]);
 */

// ==============================================================================
// Load tenant's AI provider
// ==============================================================================

export async function getTenantAiConfig(
  organizationId: string,
  useCase?: AiUseCase,
): Promise<(AiProviderConfig & { providerId: string; modelForUseCase: string }) | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('tenant_ai_providers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('is_primary', true)
    .maybeSingle();

  if (error || !data) return null;

  // NOTE: API key decryption from the DB is not yet implemented on the
  // Next.js side (needs a generic decrypt RPC). For now, the API key is
  // passed explicitly from the form (test button) or edge function env.
  // The encrypt-on-save still works for at-rest encryption in the DB.
  // Workaround: store the API key in the provider config as-is for now,
  // and the service will use it. The encrypt-on-save still works for
  // at-rest encryption in the DB.

  const row = data as {
    id: string;
    provider_type: string;
    encrypted_api_key: unknown;
    base_url: string | null;
    organization_header: string | null;
    default_model: string;
    question_gen_model: string | null;
    narrative_model: string | null;
    snapshot_model: string | null;
    temperature: number | null;
    max_tokens: number | null;
    top_p: number | null;
  };

  // Determine which model to use for this use case
  let modelForUseCase = row.default_model;
  if (useCase === 'question_generation' && row.question_gen_model) {
    modelForUseCase = row.question_gen_model;
  } else if (useCase === 'narrative' && row.narrative_model) {
    modelForUseCase = row.narrative_model;
  } else if (useCase === 'snapshot' && row.snapshot_model) {
    modelForUseCase = row.snapshot_model;
  }

  return {
    providerId: row.id,
    providerType: row.provider_type as AiProviderType,
    apiKey: '', // Will be passed separately or decrypted via edge function
    baseUrl: row.base_url ?? undefined,
    organizationHeader: row.organization_header ?? undefined,
    defaultModel: row.default_model,
    temperature: row.temperature ?? 0.7,
    maxTokens: row.max_tokens ?? 4096,
    topP: row.top_p ?? 1.0,
    modelForUseCase,
  };
}

// ==============================================================================
// Generate AI content through tenant's provider
// ==============================================================================

export async function generateAi(
  organizationId: string,
  useCase: AiUseCase,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  apiKey: string, // Passed explicitly (from edge function env or form)
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<AiResult> {
  const supabase = createAdminClient();

  // Check usage cap
  const { data: withinCap } = await rpc(supabase, 'check_ai_usage_cap', {
    p_org_id: organizationId,
  });

  if (withinCap === false) {
    return {
      success: false,
      error:
        'Monthly AI usage cap exceeded. Contact your admin to increase the limit.',
    };
  }

  // Load tenant config
  const config = await getTenantAiConfig(organizationId, useCase);
  if (!config) {
    return {
      success: false,
      error:
        'No AI provider configured. Go to Settings → AI Provider to set one up.',
    };
  }

  // Create adapter with the provided API key
  const adapter = await createAiProvider({
    ...config,
    apiKey,
  });

  const model = options?.model ?? config.modelForUseCase;

  // Call the adapter
  const result = await adapter.generate(messages, {
    model,
    temperature: options?.temperature ?? config.temperature,
    maxTokens: options?.maxTokens ?? config.maxTokens,
    topP: config.topP,
  });

  // Log usage
  const cost = result.success
    ? estimateCost(
        result.model ?? model,
        result.promptTokens ?? 0,
        result.completionTokens ?? 0,
      )
    : 0;

  await supabase.from('tenant_ai_usage').insert({
    organization_id: organizationId,
    provider_id: config.providerId,
    use_case: useCase,
    model: result.model ?? model,
    prompt_tokens: result.promptTokens ?? 0,
    completion_tokens: result.completionTokens ?? 0,
    cost_estimate_usd: cost,
    latency_ms: result.latencyMs,
    metadata: {
      success: result.success,
      error: result.error,
    },
  });

  return result;
}

// ==============================================================================
// Test AI provider (from settings page)
// ==============================================================================

export async function testAiProvider(
  organizationId: string,
  providerId: string,
  apiKey: string,
  model: string,
  providerType: AiProviderType,
  baseUrl?: string,
): Promise<AiResult> {
  const adapter = await createAiProvider({
    providerType,
    apiKey,
    defaultModel: model,
    baseUrl,
  });

  const startTime = Date.now();
  const result = await adapter.generate(
    [
      {
        role: 'system',
        content: 'You are a helpful assistant. Respond in one sentence.',
      },
      {
        role: 'user',
        content:
          'Generate a sample assessment question about teamwork skills.',
      },
    ],
    { model, maxTokens: 200, temperature: 0.7 },
  );

  // Update provider test status
  const supabase = createAdminClient();
  await supabase
    .from('tenant_ai_providers')
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_status: result.success ? 'success' : 'failed',
      last_test_error: result.error ?? null,
      last_test_latency_ms: result.latencyMs ?? (Date.now() - startTime),
    })
    .eq('id', providerId)
    .eq('organization_id', organizationId);

  // Log test usage
  if (result.success) {
    const cost = estimateCost(
      result.model ?? model,
      result.promptTokens ?? 0,
      result.completionTokens ?? 0,
    );

    await supabase.from('tenant_ai_usage').insert({
      organization_id: organizationId,
      provider_id: providerId,
      use_case: 'test',
      model: result.model ?? model,
      prompt_tokens: result.promptTokens ?? 0,
      completion_tokens: result.completionTokens ?? 0,
      cost_estimate_usd: cost,
      latency_ms: result.latencyMs,
    });
  }

  return result;
}
