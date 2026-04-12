'use client';

import { CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useActionState, useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  saveAiProviderAction,
  testAiProviderAction,
  type SaveAiProviderResult,
} from '@/app/[locale]/(app)/settings/ai/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ExistingProvider {
  id: string;
  providerType: string;
  baseUrl: string;
  organizationHeader: string;
  defaultModel: string;
  questionGenModel: string;
  narrativeModel: string;
  snapshotModel: string;
  temperature: number;
  maxTokens: number;
  monthlyTokenCap: number | null;
  monthlyCostCapUsd: number | null;
  isPrimary: boolean;
  isActive: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  lastTestLatencyMs: number | null;
}

const PROVIDERS: Array<{
  value: string;
  label: string;
  defaultModel: string;
  models: string[];
  needsBaseUrl: boolean;
}> = [
  {
    value: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'gpt-4-turbo'],
    needsBaseUrl: false,
  },
  {
    value: 'anthropic',
    label: 'Anthropic (Claude)',
    defaultModel: 'claude-sonnet-4-20250514',
    models: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
    needsBaseUrl: false,
  },
  {
    value: 'gemini',
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    needsBaseUrl: false,
  },
  {
    value: 'groq',
    label: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama-3.1-8b-instant'],
    needsBaseUrl: false,
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    needsBaseUrl: false,
  },
  {
    value: 'mistral',
    label: 'Mistral',
    defaultModel: 'mistral-large-latest',
    models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
    needsBaseUrl: false,
  },
  {
    value: 'azure_openai',
    label: 'Azure OpenAI',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini'],
    needsBaseUrl: true,
  },
  {
    value: 'ollama',
    label: 'Ollama (self-hosted)',
    defaultModel: 'llama3.1',
    models: ['llama3.1', 'mistral', 'codellama', 'phi3'],
    needsBaseUrl: true,
  },
  {
    value: 'custom',
    label: 'Custom (OpenAI-compatible)',
    defaultModel: '',
    models: [],
    needsBaseUrl: true,
  },
];

export function AiProviderForm({
  existingProvider,
}: {
  existingProvider: ExistingProvider | null;
}) {
  const locale = useLocale();
  const [providerType, setProviderType] = useState(
    existingProvider?.providerType ?? 'openai',
  );
  const [apiKey, setApiKey] = useState('');
  const [isTesting, startTesting] = useTransition();
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    text?: string;
    tokens?: number;
    latencyMs?: number;
    message?: string;
  } | null>(null);

  const [state, formAction, isPending] = useActionState<
    SaveAiProviderResult | null,
    FormData
  >(saveAiProviderAction, null);

  if (state?.ok) {
    toast.success('AI provider saved');
  }

  const selected = PROVIDERS.find((p) => p.value === providerType);

  const handleTest = () => {
    if (!existingProvider?.id || !apiKey) {
      toast.error('Enter your API key and save first, then test');
      return;
    }
    startTesting(async () => {
      const result = await testAiProviderAction(
        existingProvider.id,
        apiKey,
        existingProvider.defaultModel,
        providerType,
        existingProvider.baseUrl || undefined,
      );
      setTestResult(result);
      if (result.ok) {
        toast.success(`Test passed in ${result.latencyMs}ms`);
      } else {
        toast.error(result.message);
      }
    });
  };

  const fieldError = (field: string) =>
    state && !state.ok ? state.errors[field] : undefined;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />

        {state && !state.ok && state.message && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {state.message}
          </div>
        )}

        {/* Provider selector */}
        <div className="space-y-1.5">
          <Label htmlFor="providerType">AI provider</Label>
          <select
            id="providerType"
            name="providerType"
            value={providerType}
            onChange={(e) => setProviderType(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* API key */}
        <div className="space-y-1.5">
          <Label htmlFor="apiKey">API key</Label>
          <Input
            id="apiKey"
            name="apiKey"
            type="password"
            autoComplete="off"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={existingProvider ? '••••••••••• (enter new to replace)' : ''}
            aria-invalid={!!fieldError('apiKey')}
          />
          <p className="text-xs text-muted-foreground">
            Your key is encrypted at rest. Qudurat never stores it in plaintext.
          </p>
        </div>

        {/* Base URL (for Azure, Ollama, custom) */}
        {selected?.needsBaseUrl && (
          <div className="space-y-1.5">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              name="baseUrl"
              defaultValue={existingProvider?.baseUrl ?? ''}
              placeholder={
                providerType === 'azure_openai'
                  ? 'https://your-resource.openai.azure.com/openai/deployments/your-deployment'
                  : providerType === 'ollama'
                    ? 'http://your-server:11434/v1'
                    : 'https://api.example.com/v1'
              }
            />
          </div>
        )}

        {/* Default model */}
        <div className="space-y-1.5">
          <Label htmlFor="defaultModel">Default model</Label>
          {selected && selected.models.length > 0 ? (
            <select
              id="defaultModel"
              name="defaultModel"
              defaultValue={
                existingProvider?.defaultModel ?? selected.defaultModel
              }
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm"
            >
              {selected.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="defaultModel"
              name="defaultModel"
              defaultValue={existingProvider?.defaultModel ?? ''}
              placeholder="model-name"
              required
            />
          )}
        </div>

        {/* Per-use-case model overrides (collapsible) */}
        <details className="rounded-lg border border-border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
            Per-use-case model routing (optional)
          </summary>
          <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="questionGenModel" className="text-xs">
                Question generation
              </Label>
              <Input
                id="questionGenModel"
                name="questionGenModel"
                defaultValue={existingProvider?.questionGenModel ?? ''}
                placeholder="(uses default)"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="narrativeModel" className="text-xs">
                Narrative reports
              </Label>
              <Input
                id="narrativeModel"
                name="narrativeModel"
                defaultValue={existingProvider?.narrativeModel ?? ''}
                placeholder="(uses default)"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="snapshotModel" className="text-xs">
                Talent snapshots
              </Label>
              <Input
                id="snapshotModel"
                name="snapshotModel"
                defaultValue={existingProvider?.snapshotModel ?? ''}
                placeholder="(uses default)"
                className="text-xs"
              />
            </div>
          </div>
        </details>

        {/* Temperature + max tokens */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              name="temperature"
              type="number"
              step="0.1"
              min="0"
              max="2"
              defaultValue={existingProvider?.temperature ?? 0.7}
            />
            <p className="text-xs text-muted-foreground">
              0 = deterministic, 1 = creative, 2 = very random
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxTokens">Max tokens</Label>
            <Input
              id="maxTokens"
              name="maxTokens"
              type="number"
              min="100"
              max="128000"
              defaultValue={existingProvider?.maxTokens ?? 4096}
            />
          </div>
        </div>

        {/* Cost caps */}
        <details className="rounded-lg border border-border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
            Monthly usage caps (optional)
          </summary>
          <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="monthlyTokenCap" className="text-xs">
                Token cap (per month)
              </Label>
              <Input
                id="monthlyTokenCap"
                name="monthlyTokenCap"
                type="number"
                defaultValue={existingProvider?.monthlyTokenCap ?? ''}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthlyCostCapUsd" className="text-xs">
                Cost cap USD (per month)
              </Label>
              <Input
                id="monthlyCostCapUsd"
                name="monthlyCostCapUsd"
                type="number"
                step="0.01"
                defaultValue={existingProvider?.monthlyCostCapUsd ?? ''}
                placeholder="Unlimited"
              />
            </div>
          </div>
        </details>

        {/* Toggles */}
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPrimary"
              defaultChecked={existingProvider?.isPrimary ?? true}
              className="h-4 w-4 rounded border-input text-primary"
            />
            <span className="text-sm">Set as primary provider</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={existingProvider?.isActive ?? true}
              className="h-4 w-4 rounded border-input text-primary"
            />
            <span className="text-sm font-medium">
              Active (enable AI features)
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save provider
          </Button>

          {existingProvider?.id && apiKey && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Test AI
            </Button>
          )}
        </div>
      </form>

      {/* Test result */}
      {testResult && (
        <div
          className={cn(
            'rounded-lg border p-4 text-sm',
            testResult.ok
              ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20'
              : 'border-destructive/30 bg-destructive/5',
          )}
        >
          {testResult.ok ? (
            <>
              <div className="mb-2 flex items-center gap-2 font-medium text-green-800 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                Test passed — {testResult.latencyMs}ms, {testResult.tokens} tokens
              </div>
              <div className="rounded bg-white/50 p-3 text-xs text-muted-foreground dark:bg-black/20">
                {testResult.text}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              {testResult.message}
            </div>
          )}
        </div>
      )}

      {/* Previous test status */}
      {existingProvider?.lastTestedAt && !testResult && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border p-3 text-sm',
            existingProvider.lastTestStatus === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-destructive/30 bg-destructive/5 text-destructive',
          )}
        >
          {existingProvider.lastTestStatus === 'success' ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Last test passed
              {existingProvider.lastTestLatencyMs && (
                <> — {existingProvider.lastTestLatencyMs}ms</>
              )}
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              {existingProvider.lastTestError ?? 'Last test failed'}
            </>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(existingProvider.lastTestedAt).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
