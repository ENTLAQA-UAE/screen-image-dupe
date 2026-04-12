import { Check, Clock, CreditCard, Receipt } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PaymentMethodTabs } from '@/app/[locale]/(app)/settings/billing/payment-method-tabs';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getActiveBankProvider,
  getCurrentSubscription,
  listInvoices,
  listPublicPlans,
} from '@/lib/domain/billing-queries';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Billing & Subscription',
};

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile || !profile.organizationId) redirect(`/${locale}/login`);
  if (!profile.isOrgAdmin) notFound();

  const [subscription, plans, invoices, bankProvider] = await Promise.all([
    getCurrentSubscription(profile.organizationId),
    listPublicPlans(),
    listInvoices(profile.organizationId, 10),
    getActiveBankProvider(),
  ]);

  const daysLeft = subscription
    ? Math.ceil(
        (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription, payment method, and invoices"
      />

      {/* Current subscription */}
      {subscription && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Current plan</CardTitle>
                <CardDescription className="mt-1">
                  You are currently on the {subscription.planName} plan
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={
                    subscription.status === 'active'
                      ? 'success'
                      : subscription.status === 'trialing'
                        ? 'default'
                        : subscription.status === 'past_due'
                          ? 'warning'
                          : 'secondary'
                  }
                >
                  {subscription.status}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {subscription.paymentMethod.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  Billing cycle
                </div>
                <div className="mt-1 font-semibold capitalize">
                  {subscription.billingCycle}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  {subscription.status === 'trialing'
                    ? 'Trial ends'
                    : 'Renews on'}
                </div>
                <div className="mt-1 font-semibold">
                  {new Intl.DateTimeFormat(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }).format(new Date(subscription.currentPeriodEnd))}
                </div>
                {daysLeft > 0 && daysLeft <= 14 && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                    <Clock className="h-3 w-3" />
                    {daysLeft} days remaining
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  Activated
                </div>
                <div className="mt-1 font-semibold">
                  {subscription.manuallyActivatedAt
                    ? 'Manually by admin'
                    : subscription.paymentMethod === 'stripe'
                      ? 'Via Stripe'
                      : 'Auto'}
                </div>
              </div>
            </div>

            {subscription.bankTransferReference && (
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="font-medium">Bank transfer reference</div>
                <code className="mt-1 block font-mono text-xs text-muted-foreground">
                  {subscription.bankTransferReference}
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment method selection (upgrade / change plan) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Upgrade or change plan
          </CardTitle>
          <CardDescription>
            Choose your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethodTabs
            plans={plans}
            currentPlanSlug={subscription?.planSlug ?? null}
            bankProvider={
              bankProvider
                ? {
                    bankName: bankProvider.bankName,
                    bankAccountName: bankProvider.bankAccountName,
                    bankAccountNumber: bankProvider.bankAccountNumber,
                    bankIban: bankProvider.bankIban,
                    bankSwift: bankProvider.bankSwift,
                    bankCurrency: bankProvider.bankCurrency,
                    bankInstructions: bankProvider.bankInstructions,
                    bankInstructionsAr: bankProvider.bankInstructionsAr,
                  }
                : null
            }
            defaultBillingEmail={profile.email}
          />
        </CardContent>
      </Card>

      {/* Invoices history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No invoices yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      {inv.paymentMethod.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'open' ||
                                inv.status === 'pending_transfer'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {inv.status === 'paid' && (
                          <Check className="h-3 w-3" />
                        )}
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-mono font-semibold">
                      ${inv.amountUsd.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }).format(new Date(inv.createdAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
