'use client';

import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState } from 'react';
import { toast } from 'sonner';

import {
  activateSubscriptionManuallyAction,
  type ManualActivationResult,
} from '@/app/[locale]/(admin)/admin/billing/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Plan } from '@/lib/domain/billing-types';

interface Props {
  organizations: { id: string; name: string }[];
  plans: Plan[];
  defaultOrgId?: string;
  defaultPlanId?: string;
  defaultBillingCycle?: 'monthly' | 'annual';
  defaultBankTransferRequestId?: string;
}

export function ManualActivationForm({
  organizations,
  plans,
  defaultOrgId,
  defaultPlanId,
  defaultBillingCycle = 'annual',
  defaultBankTransferRequestId,
}: Props) {
  const [state, formAction, isPending] = useActionState<
    ManualActivationResult | null,
    FormData
  >(activateSubscriptionManuallyAction, null);

  if (state?.ok) {
    toast.success('Subscription activated');
  }

  const fieldError = (field: string) =>
    state && !state.ok ? state.errors[field] : undefined;

  if (state?.ok) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/40 dark:bg-green-950/20">
        <Check className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
        <h3 className="mt-3 font-semibold text-green-900 dark:text-green-100">
          Subscription activated
        </h3>
        <p className="mt-1 text-sm text-green-800 dark:text-green-200">
          Subscription ID:{' '}
          <code className="font-mono">{state.subscriptionId}</code>
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/billing/subscriptions">Back to list</Link>
          </Button>
          <Button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.reload();
            }}
          >
            Activate another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {defaultBankTransferRequestId && (
        <input
          type="hidden"
          name="bankTransferRequestId"
          value={defaultBankTransferRequestId}
        />
      )}

      {state && !state.ok && state.message && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="organizationId">Organization</Label>
        <select
          id="organizationId"
          name="organizationId"
          required
          defaultValue={defaultOrgId}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        >
          <option value="">Select organization...</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        {fieldError('organizationId') && (
          <p className="text-xs text-destructive">
            {fieldError('organizationId')}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="planId">Plan</Label>
          <select
            id="planId"
            name="planId"
            required
            defaultValue={defaultPlanId}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            <option value="">Select plan...</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.priceMonthlyUsd !== null
                  ? ` — $${p.priceMonthlyUsd}/mo`
                  : ' — Custom'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="billingCycle">Billing cycle</Label>
          <select
            id="billingCycle"
            name="billingCycle"
            required
            defaultValue={defaultBillingCycle}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="paymentMethod">Payment method</Label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            required
            defaultValue="bank_transfer"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="invoice">Invoice</option>
            <option value="complimentary">Complimentary (free)</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Online Stripe subscriptions are created automatically by the webhook
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="durationMonths">Duration (months)</Label>
          <Input
            id="durationMonths"
            name="durationMonths"
            type="number"
            min={1}
            max={60}
            required
            defaultValue={12}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bankTransferReference">
          Bank transfer reference (transaction ID, SWIFT ref, date, amount)
        </Label>
        <Input
          id="bankTransferReference"
          name="bankTransferReference"
          placeholder="TXN-2026-04-11-12345 / $9990.00 / ENBD"
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Reason for manual activation, contact person, PO number, etc."
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Activate subscription
        </Button>
      </div>
    </form>
  );
}
