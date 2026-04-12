'use client';

import { CheckCircle2, Loader2, Send, XCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useActionState, useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  saveEmailProviderAction,
  testEmailProviderAction,
  type SaveProviderResult,
} from '@/app/[locale]/(app)/settings/email/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ExistingProvider {
  id: string;
  providerType: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  providerDomain: string;
  providerRegion: string;
  isPrimary: boolean;
  isActive: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
}

interface Props {
  existingProvider: ExistingProvider | null;
  userEmail: string;
}

const PROVIDER_OPTIONS: Array<{
  value: string;
  label: string;
  fields: string[];
}> = [
  { value: 'resend', label: 'Resend', fields: ['apiKey'] },
  { value: 'mailgun', label: 'Mailgun', fields: ['apiKey', 'domain', 'region'] },
  { value: 'sendgrid', label: 'SendGrid', fields: ['apiKey'] },
  { value: 'postmark', label: 'Postmark', fields: ['apiKey'] },
  { value: 'ses', label: 'Amazon SES', fields: ['smtpUsername', 'smtpPassword', 'region'] },
  { value: 'smtp', label: 'Direct SMTP', fields: ['smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword', 'smtpSecure'] },
];

export function EmailProviderForm({ existingProvider, userEmail }: Props) {
  const locale = useLocale();
  const [providerType, setProviderType] = useState(
    existingProvider?.providerType ?? 'resend',
  );
  const [isTesting, startTesting] = useTransition();
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message?: string;
  } | null>(null);

  const [state, formAction, isPending] = useActionState<
    SaveProviderResult | null,
    FormData
  >(saveEmailProviderAction, null);

  if (state?.ok) {
    toast.success('Email provider saved');
  }

  const selectedProvider = PROVIDER_OPTIONS.find(
    (p) => p.value === providerType,
  );
  const showApiKey = selectedProvider?.fields.includes('apiKey');
  const showSmtp =
    selectedProvider?.fields.includes('smtpHost') ||
    selectedProvider?.fields.includes('smtpUsername');
  const showDomain = selectedProvider?.fields.includes('domain');
  const showRegion = selectedProvider?.fields.includes('region');

  const handleTest = () => {
    if (!existingProvider?.id) {
      toast.error('Save the provider first, then test');
      return;
    }
    startTesting(async () => {
      const result = await testEmailProviderAction(
        existingProvider.id,
        userEmail,
      );
      setTestResult(result);
      if (result.ok) {
        toast.success(`Test email sent to ${userEmail}`);
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

        {/* Provider type selector */}
        <div className="space-y-1.5">
          <Label htmlFor="providerType">Email provider</Label>
          <select
            id="providerType"
            name="providerType"
            value={providerType}
            onChange={(e) => setProviderType(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sender identity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fromEmail">From email</Label>
            <Input
              id="fromEmail"
              name="fromEmail"
              type="email"
              required
              defaultValue={existingProvider?.fromEmail ?? ''}
              placeholder="hello@yourdomain.com"
              aria-invalid={!!fieldError('fromEmail')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fromName">From name</Label>
            <Input
              id="fromName"
              name="fromName"
              defaultValue={existingProvider?.fromName ?? ''}
              placeholder="Your Organization"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="replyTo">Reply-to email (optional)</Label>
          <Input
            id="replyTo"
            name="replyTo"
            type="email"
            defaultValue={existingProvider?.replyTo ?? ''}
            placeholder="support@yourdomain.com"
          />
        </div>

        {/* API key (for Resend, Mailgun, SendGrid, Postmark) */}
        {showApiKey && (
          <div className="space-y-1.5">
            <Label htmlFor="apiKey">API key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              autoComplete="off"
              placeholder={
                existingProvider ? '••••••••••• (enter new to replace)' : ''
              }
              aria-invalid={!!fieldError('apiKey')}
            />
            <p className="text-xs text-muted-foreground">
              {providerType === 'resend' && 'Find this in Resend Dashboard → API Keys'}
              {providerType === 'mailgun' && 'Find this in Mailgun Dashboard → API Security'}
              {providerType === 'sendgrid' && 'Find this in SendGrid Settings → API Keys'}
              {providerType === 'postmark' && 'Use your Server Token from Postmark'}
            </p>
          </div>
        )}

        {/* Mailgun domain */}
        {showDomain && (
          <div className="space-y-1.5">
            <Label htmlFor="providerDomain">Sending domain</Label>
            <Input
              id="providerDomain"
              name="providerDomain"
              defaultValue={existingProvider?.providerDomain ?? ''}
              placeholder="mg.yourdomain.com"
            />
          </div>
        )}

        {/* Region (Mailgun, SES) */}
        {showRegion && (
          <div className="space-y-1.5">
            <Label htmlFor="providerRegion">Region</Label>
            <select
              id="providerRegion"
              name="providerRegion"
              defaultValue={existingProvider?.providerRegion ?? 'us'}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="us">US</option>
              <option value="eu">EU</option>
              <option value="us-east-1">us-east-1 (SES)</option>
              <option value="eu-west-1">eu-west-1 (SES)</option>
              <option value="me-south-1">me-south-1 (SES — Bahrain)</option>
            </select>
          </div>
        )}

        {/* SMTP fields */}
        {showSmtp && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="smtpHost">SMTP host</Label>
                <Input
                  id="smtpHost"
                  name="smtpHost"
                  defaultValue={existingProvider?.smtpHost ?? ''}
                  placeholder="smtp.yourdomain.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpPort">Port</Label>
                <Input
                  id="smtpPort"
                  name="smtpPort"
                  type="number"
                  defaultValue={existingProvider?.smtpPort ?? 587}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="smtpUsername">Username</Label>
                <Input
                  id="smtpUsername"
                  name="smtpUsername"
                  defaultValue={existingProvider?.smtpUsername ?? ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpPassword">Password</Label>
                <Input
                  id="smtpPassword"
                  name="smtpPassword"
                  type="password"
                  autoComplete="off"
                  placeholder={existingProvider ? '•••••••••••' : ''}
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="smtpSecure"
                defaultChecked={existingProvider?.smtpSecure ?? true}
                className="h-4 w-4 rounded border-input text-primary"
              />
              <span className="text-sm">Use TLS/SSL</span>
            </label>
          </>
        )}

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
              Active (enable email sending)
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save provider
          </Button>

          {existingProvider?.id && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send test email
            </Button>
          )}
        </div>
      </form>

      {/* Test status */}
      {existingProvider?.lastTestedAt && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border p-3 text-sm',
            existingProvider.lastTestStatus === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-300'
              : 'border-destructive/30 bg-destructive/5 text-destructive',
          )}
        >
          {existingProvider.lastTestStatus === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>
            Last test:{' '}
            {existingProvider.lastTestStatus === 'success'
              ? 'passed'
              : existingProvider.lastTestError ?? 'failed'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(existingProvider.lastTestedAt).toLocaleString()}
          </span>
        </div>
      )}

      {testResult && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border p-3 text-sm',
            testResult.ok
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-destructive/30 bg-destructive/5 text-destructive',
          )}
        >
          {testResult.ok ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Test email sent to {userEmail}
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              {testResult.message}
            </>
          )}
        </div>
      )}
    </div>
  );
}
