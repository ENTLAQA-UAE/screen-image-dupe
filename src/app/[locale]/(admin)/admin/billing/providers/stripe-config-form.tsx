'use client';

import { Loader2 } from 'lucide-react';
import { useActionState } from 'react';
import { toast } from 'sonner';

import {
  configureStripeAction,
  type ProviderConfigResult,
} from '@/app/[locale]/(admin)/admin/billing/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  hasExistingConfig: boolean;
  publishableKey: string;
  accountId: string;
  isTestMode: boolean;
  isActive: boolean;
}

export function StripeConfigForm({
  hasExistingConfig,
  publishableKey,
  accountId,
  isTestMode,
  isActive,
}: Props) {
  const [state, formAction, isPending] = useActionState<
    ProviderConfigResult | null,
    FormData
  >(configureStripeAction, null);

  if (state?.ok) {
    toast.success('Stripe configuration saved');
  }

  const fieldError = (field: string) =>
    state && !state.ok ? state.errors[field] : undefined;

  return (
    <form action={formAction} className="space-y-4">
      {hasExistingConfig && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Existing credentials are encrypted. Enter new values only to replace
          them. Leave blank to keep current values (not supported yet — always
          re-enter).
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="apiKey">Secret API key (sk_live_... or sk_test_...)</Label>
        <Input
          id="apiKey"
          name="apiKey"
          type="password"
          required
          autoComplete="off"
          placeholder={hasExistingConfig ? '••••••••••••••••' : 'sk_live_...'}
          aria-invalid={!!fieldError('apiKey')}
        />
        {fieldError('apiKey') && (
          <p className="text-xs text-destructive">{fieldError('apiKey')}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Find this in Stripe Dashboard → Developers → API keys
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="webhookSecret">Webhook signing secret (whsec_...)</Label>
        <Input
          id="webhookSecret"
          name="webhookSecret"
          type="password"
          required
          autoComplete="off"
          placeholder="whsec_..."
          aria-invalid={!!fieldError('webhookSecret')}
        />
        {fieldError('webhookSecret') && (
          <p className="text-xs text-destructive">
            {fieldError('webhookSecret')}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Configure a webhook endpoint at Dashboard → Developers → Webhooks,
          pointing to <code>/api/webhooks/stripe</code>. Copy the signing
          secret shown there.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="publishableKey">
          Publishable key (pk_live_... or pk_test_...)
        </Label>
        <Input
          id="publishableKey"
          name="publishableKey"
          required
          defaultValue={publishableKey}
          placeholder="pk_live_..."
          aria-invalid={!!fieldError('publishableKey')}
        />
        <p className="text-xs text-muted-foreground">
          Safe to expose to client. Used by Stripe.js for card elements.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="accountId">Account ID (optional)</Label>
        <Input
          id="accountId"
          name="accountId"
          defaultValue={accountId}
          placeholder="acct_..."
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isTestMode"
            defaultChecked={isTestMode}
            className="h-4 w-4 rounded border-input text-primary"
          />
          <span className="text-sm">
            Test mode (use Stripe test keys and test card numbers)
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={isActive}
            className="h-4 w-4 rounded border-input text-primary"
          />
          <span className="text-sm font-medium">
            Active (customers can use Stripe checkout)
          </span>
        </label>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Stripe configuration
      </Button>
    </form>
  );
}
