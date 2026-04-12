'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { testAiProvider } from '@/lib/ai/service';
import type { AiProviderType } from '@/lib/ai/types';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';
import { rpc } from '@/lib/supabase/types';

// ==============================================================================
// Save AI provider
// ==============================================================================

const providerSchema = z.object({
  providerType: z.enum([
    'openai', 'anthropic', 'gemini', 'azure_openai',
    'groq', 'deepseek', 'mistral', 'ollama', 'custom',
  ]),
  apiKey: z.string().trim().min(5),
  baseUrl: z.string().trim().url().optional().nullable().or(z.literal('')),
  organizationHeader: z.string().trim().optional().nullable().or(z.literal('')),
  defaultModel: z.string().trim().min(1),
  questionGenModel: z.string().trim().optional().nullable().or(z.literal('')),
  narrativeModel: z.string().trim().optional().nullable().or(z.literal('')),
  snapshotModel: z.string().trim().optional().nullable().or(z.literal('')),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().int().min(100).max(128000),
  monthlyTokenCap: z.coerce.number().int().min(0).optional().nullable(),
  monthlyCostCapUsd: z.coerce.number().min(0).optional().nullable(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
});

export type SaveAiProviderResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string>; message?: string };

export async function saveAiProviderAction(
  _prev: SaveAiProviderResult | null,
  formData: FormData,
): Promise<SaveAiProviderResult> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId || !profile.isOrgAdmin) {
    return { ok: false, errors: {}, message: 'Org admin access required' };
  }

  const parsed = providerSchema.safeParse({
    providerType: formData.get('providerType'),
    apiKey: formData.get('apiKey'),
    baseUrl: formData.get('baseUrl') || null,
    organizationHeader: formData.get('organizationHeader') || null,
    defaultModel: formData.get('defaultModel'),
    questionGenModel: formData.get('questionGenModel') || null,
    narrativeModel: formData.get('narrativeModel') || null,
    snapshotModel: formData.get('snapshotModel') || null,
    temperature: formData.get('temperature') ?? 0.7,
    maxTokens: formData.get('maxTokens') ?? 4096,
    monthlyTokenCap: formData.get('monthlyTokenCap') || null,
    monthlyCostCapUsd: formData.get('monthlyCostCapUsd') || null,
    isPrimary: formData.get('isPrimary') === 'on',
    isActive: formData.get('isActive') === 'on',
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const err of parsed.error.errors) {
      if (err.path[0]) errors[err.path[0] as string] = err.message;
    }
    return { ok: false, errors };
  }

  const supabase = createAdminClient();

  // Encrypt API key
  const { data: encryptedKey } = await rpc(supabase, 'encrypt_email_secret', {
    plain_text: parsed.data.apiKey,
  });

  const { error } = await supabase
    .from('tenant_ai_providers')
    .upsert(
      {
        organization_id: profile.organizationId,
        provider_type: parsed.data.providerType,
        is_primary: parsed.data.isPrimary,
        is_active: parsed.data.isActive,
        encrypted_api_key: encryptedKey,
        base_url: parsed.data.baseUrl || null,
        organization_header: parsed.data.organizationHeader || null,
        default_model: parsed.data.defaultModel,
        question_gen_model: parsed.data.questionGenModel || null,
        narrative_model: parsed.data.narrativeModel || null,
        snapshot_model: parsed.data.snapshotModel || null,
        temperature: parsed.data.temperature,
        max_tokens: parsed.data.maxTokens,
        monthly_token_cap: parsed.data.monthlyTokenCap || null,
        monthly_cost_cap_usd: parsed.data.monthlyCostCapUsd || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,provider_type' },
    );

  if (error) {
    return { ok: false, errors: {}, message: error.message };
  }

  const locale = (formData.get('locale') as string) ?? 'en';
  revalidatePath(`/${locale}/settings/ai`);
  return { ok: true };
}

// ==============================================================================
// Test AI provider
// ==============================================================================

export type TestAiResult =
  | { ok: true; text: string; tokens: number; latencyMs: number; model: string }
  | { ok: false; message: string };

export async function testAiProviderAction(
  providerId: string,
  apiKey: string,
  model: string,
  providerType: string,
  baseUrl?: string,
): Promise<TestAiResult> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId || !profile.isOrgAdmin) {
    return { ok: false, message: 'Org admin access required' };
  }

  const result = await testAiProvider(
    profile.organizationId,
    providerId,
    apiKey,
    model,
    providerType as AiProviderType,
    baseUrl,
  );

  if (!result.success) {
    return { ok: false, message: result.error ?? 'Test failed' };
  }

  return {
    ok: true,
    text: result.text ?? '',
    tokens: result.totalTokens ?? 0,
    latencyMs: result.latencyMs ?? 0,
    model: result.model ?? model,
  };
}
