import { Brain } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { AiProviderForm } from '@/app/[locale]/(app)/settings/ai/ai-provider-form';
import { AiUsageStats } from '@/app/[locale]/(app)/settings/ai/ai-usage-stats';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'AI provider settings',
};

async function getAiProvider(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenant_ai_providers')
    .select(
      'id, provider_type, is_primary, is_active, base_url, organization_header, default_model, question_gen_model, narrative_model, snapshot_model, temperature, max_tokens, top_p, monthly_token_cap, monthly_cost_cap_usd, last_tested_at, last_test_status, last_test_error, last_test_latency_ms, created_at, updated_at',
    )
    .eq('organization_id', organizationId)
    .eq('is_primary', true)
    .maybeSingle();

  return data as {
    id: string;
    provider_type: string;
    is_primary: boolean;
    is_active: boolean;
    base_url: string | null;
    organization_header: string | null;
    default_model: string;
    question_gen_model: string | null;
    narrative_model: string | null;
    snapshot_model: string | null;
    temperature: number;
    max_tokens: number;
    top_p: number;
    monthly_token_cap: number | null;
    monthly_cost_cap_usd: number | null;
    last_tested_at: string | null;
    last_test_status: string | null;
    last_test_error: string | null;
    last_test_latency_ms: number | null;
  } | null;
}

async function getMonthlyUsage(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenant_ai_usage')
    .select('use_case, model, prompt_tokens, completion_tokens, cost_estimate_usd, latency_ms, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []) as Array<{
    use_case: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    cost_estimate_usd: number | null;
    latency_ms: number | null;
    created_at: string;
  }>;
}

export default async function AiSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);
  if (!profile.isOrgAdmin) notFound();

  const [provider, usage] = await Promise.all([
    getAiProvider(profile.organizationId),
    getMonthlyUsage(profile.organizationId),
  ]);

  const totalTokens = usage.reduce(
    (sum, u) => sum + u.prompt_tokens + u.completion_tokens,
    0,
  );
  const totalCost = usage.reduce(
    (sum, u) => sum + (u.cost_estimate_usd ?? 0),
    0,
  );

  return (
    <div className="container max-w-4xl py-10">
      <PageHeader
        title="AI provider"
        description="Configure the AI model used for question generation, narratives, and talent snapshots"
      />

      {/* Provider config */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {provider ? 'AI provider configuration' : 'Set up your AI provider'}
              </CardTitle>
              <CardDescription className="mt-1">
                {provider
                  ? `Using ${provider.provider_type} with model ${provider.default_model}`
                  : 'Connect your AI provider to enable question generation and narratives'}
              </CardDescription>
            </div>
            {provider?.is_active && <Badge variant="success">Active</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <AiProviderForm
            existingProvider={
              provider
                ? {
                    id: provider.id,
                    providerType: provider.provider_type,
                    baseUrl: provider.base_url ?? '',
                    organizationHeader: provider.organization_header ?? '',
                    defaultModel: provider.default_model,
                    questionGenModel: provider.question_gen_model ?? '',
                    narrativeModel: provider.narrative_model ?? '',
                    snapshotModel: provider.snapshot_model ?? '',
                    temperature: provider.temperature,
                    maxTokens: provider.max_tokens,
                    monthlyTokenCap: provider.monthly_token_cap,
                    monthlyCostCapUsd: provider.monthly_cost_cap_usd,
                    isPrimary: provider.is_primary,
                    isActive: provider.is_active,
                    lastTestedAt: provider.last_tested_at,
                    lastTestStatus: provider.last_test_status,
                    lastTestError: provider.last_test_error,
                    lastTestLatencyMs: provider.last_test_latency_ms,
                  }
                : null
            }
          />
        </CardContent>
      </Card>

      {/* Usage stats */}
      <Card>
        <CardHeader>
          <CardTitle>This month&apos;s usage</CardTitle>
          <CardDescription>
            {totalTokens.toLocaleString()} tokens used •{' '}
            ${totalCost.toFixed(4)} estimated cost
            {provider?.monthly_token_cap && (
              <> • Cap: {provider.monthly_token_cap.toLocaleString()} tokens</>
            )}
            {provider?.monthly_cost_cap_usd && (
              <> • Cap: ${provider.monthly_cost_cap_usd.toFixed(2)}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AiUsageStats usage={usage} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
