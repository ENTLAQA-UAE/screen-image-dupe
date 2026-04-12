'use client';

import { Building2, Check, CreditCard, Loader2 } from 'lucide-react';
import { useActionState, useState } from 'react';
import { toast } from 'sonner';

import {
  createCheckoutSessionAction,
  requestBankTransferAction,
  type BankTransferRequestResult,
  type CheckoutResult,
} from '@/app/[locale]/(app)/settings/billing/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Plan, PlanSlug } from '@/lib/domain/billing-types';
import { cn } from '@/lib/utils';

interface BankProviderInfo {
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  bankSwift: string | null;
  bankCurrency: string | null;
  bankInstructions: string | null;
  bankInstructionsAr: string | null;
}

interface Props {
  plans: Plan[];
  currentPlanSlug: PlanSlug | null;
  bankProvider: BankProviderInfo | null;
  defaultBillingEmail: string;
}

type Tab = 'stripe' | 'bank';
type Cycle = 'monthly' | 'annual';

export function PaymentMethodTabs({
  plans,
  currentPlanSlug,
  bankProvider,
  defaultBillingEmail,
}: Props) {
  const [tab, setTab] = useState<Tab>('stripe');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(
    plans.find((p) => p.slug === 'professional') ?? plans[0] ?? null,
  );
  const [billingCycle, setBillingCycle] = useState<Cycle>('annual');

  const paidPlans = plans.filter(
    (p) => p.slug !== 'free_trial' && p.priceMonthlyUsd !== null,
  );

  return (
    <div className="space-y-6">
      {/* Plan selector */}
      <div className="space-y-3">
        <Label>Select a plan</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {paidPlans.map((plan) => {
            const isSelected = selectedPlan?.id === plan.id;
            const isCurrent = plan.slug === currentPlanSlug;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className={cn(
                  'relative rounded-xl border bg-card p-4 text-start transition-all',
                  isSelected
                    ? 'border-primary shadow-md ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50',
                )}
              >
                {isSelected && (
                  <div className="absolute end-3 top-3">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="font-display text-lg font-semibold">
                    {plan.name}
                  </div>
                  {isCurrent && (
                    <Badge variant="outline" className="text-[10px]">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {plan.description}
                </div>
                <div className="mt-3">
                  <span className="font-display text-2xl font-bold">
                    ${plan.priceMonthlyUsd}
                  </span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Billing cycle */}
      <div className="space-y-3">
        <Label>Billing cycle</Label>
        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              billingCycle === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              billingCycle === 'annual'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Annual
            <Badge variant="success" className="ms-2 text-[9px]">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Payment method tabs */}
      <div>
        <Label>Payment method</Label>
        <div className="mt-2 flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab('stripe')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === 'stripe'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <CreditCard className="h-4 w-4" />
            Credit / Debit card
          </button>
          <button
            type="button"
            onClick={() => setTab('bank')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === 'bank'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Building2 className="h-4 w-4" />
            Bank transfer
          </button>
        </div>

        <div className="mt-6">
          {tab === 'stripe' && selectedPlan && (
            <StripeCheckoutForm
              planId={selectedPlan.id}
              billingCycle={billingCycle}
            />
          )}

          {tab === 'bank' && selectedPlan && (
            <BankTransferForm
              plan={selectedPlan}
              billingCycle={billingCycle}
              bankProvider={bankProvider}
              defaultBillingEmail={defaultBillingEmail}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// Stripe checkout form
// ==============================================================================

function StripeCheckoutForm({
  planId,
  billingCycle,
}: {
  planId: string;
  billingCycle: Cycle;
}) {
  const [state, formAction, isPending] = useActionState<
    CheckoutResult | null,
    FormData
  >(createCheckoutSessionAction, null);

  if (state?.ok && state.url) {
    if (typeof window !== 'undefined') {
      window.location.href = state.url;
    }
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Redirecting to Stripe...
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="billingCycle" value={billingCycle} />

      {state && !state.ok && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          {state.message}
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">
        You&apos;ll be redirected to Stripe&apos;s secure checkout. Your payment
        method will be charged {billingCycle}.
      </p>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Continue to Stripe
      </Button>
    </form>
  );
}

// ==============================================================================
// Bank transfer request form
// ==============================================================================

function BankTransferForm({
  plan,
  billingCycle,
  bankProvider,
  defaultBillingEmail,
}: {
  plan: Plan;
  billingCycle: Cycle;
  bankProvider: BankProviderInfo | null;
  defaultBillingEmail: string;
}) {
  const [state, formAction, isPending] = useActionState<
    BankTransferRequestResult | null,
    FormData
  >(requestBankTransferAction, null);

  const amount =
    billingCycle === 'annual' ? plan.priceAnnualUsd : plan.priceMonthlyUsd;

  if (state?.ok) {
    toast.success('Bank transfer request submitted');
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/40 dark:bg-green-950/20">
        <Check className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
        <h3 className="mt-3 font-semibold text-green-900 dark:text-green-100">
          Request submitted
        </h3>
        <p className="mt-1 text-sm text-green-800 dark:text-green-200">
          Our billing team will review your request and send you a proforma
          invoice shortly. You&apos;ll receive confirmation at your billing email.
        </p>
      </div>
    );
  }

  const fieldError = (field: string) =>
    state && !state.ok ? state.errors[field] : undefined;

  return (
    <div className="space-y-6">
      {bankProvider ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="mb-3 text-sm font-semibold">Our bank details</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Detail label="Bank name" value={bankProvider.bankName} />
            <Detail
              label="Account name"
              value={bankProvider.bankAccountName}
            />
            <Detail
              label="Account number"
              value={bankProvider.bankAccountNumber}
            />
            <Detail label="IBAN" value={bankProvider.bankIban} />
            <Detail label="SWIFT/BIC" value={bankProvider.bankSwift} />
            <Detail label="Currency" value={bankProvider.bankCurrency} />
          </dl>
          {bankProvider.bankInstructions && (
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground whitespace-pre-wrap">
              {bankProvider.bankInstructions}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          Bank transfer is not yet configured. Please contact support.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="planId" value={plan.id} />
        <input type="hidden" name="billingCycle" value={billingCycle} />

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {plan.name} — {billingCycle}
            </span>
            <span className="font-display text-xl font-bold">
              ${amount?.toFixed(2) ?? '—'}
            </span>
          </div>
        </div>

        {state && !state.ok && state.message && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {state.message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              name="companyName"
              required
              aria-invalid={!!fieldError('companyName')}
            />
            {fieldError('companyName') && (
              <p className="text-xs text-destructive">
                {fieldError('companyName')}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="companyVatNumber">VAT / Tax ID (optional)</Label>
            <Input id="companyVatNumber" name="companyVatNumber" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="billingEmail">Billing email</Label>
          <Input
            id="billingEmail"
            name="billingEmail"
            type="email"
            required
            defaultValue={defaultBillingEmail}
            aria-invalid={!!fieldError('billingEmail')}
          />
          {fieldError('billingEmail') && (
            <p className="text-xs text-destructive">
              {fieldError('billingEmail')}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="billingAddress">Billing address</Label>
          <textarea
            id="billingAddress"
            name="billingAddress"
            rows={3}
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="PO number, payment date, etc."
            className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isPending || !bankProvider}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit bank transfer request
        </Button>
      </form>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-sm">{value ?? '—'}</dd>
    </div>
  );
}
