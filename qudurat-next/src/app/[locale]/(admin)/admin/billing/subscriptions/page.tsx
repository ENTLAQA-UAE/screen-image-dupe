import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  listAllPlans,
  listAllSubscriptions,
} from '@/lib/domain/billing-queries';
import { Link } from '@/lib/i18n/routing';

export const metadata: Metadata = {
  title: 'All Subscriptions',
};

export default async function AllSubscriptionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [subscriptions, plans] = await Promise.all([
    listAllSubscriptions(),
    listAllPlans(),
  ]);

  return (
    <div className="container max-w-6xl py-10">
      <PageHeader
        title="All Subscriptions"
        description="Cross-tenant subscription management"
        action={
          <Button asChild>
            <Link href="/admin/billing/activate">Activate manually</Link>
          </Button>
        }
      />

      <div className="mb-4 text-sm text-muted-foreground">
        {subscriptions.length} subscriptions across{' '}
        {new Set(subscriptions.map((s) => s.organizationId)).size} organizations
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Period end</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.organizationName}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{s.planName}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      s.status === 'active'
                        ? 'success'
                        : s.status === 'trialing'
                          ? 'default'
                          : s.status === 'past_due' ||
                              s.status === 'pending_payment'
                            ? 'warning'
                            : 'secondary'
                    }
                  >
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs capitalize">
                    {s.paymentMethod.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm capitalize text-muted-foreground">
                  {s.billingCycle}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat(locale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }).format(new Date(s.currentPeriodEnd))}
                </TableCell>
                <TableCell className="text-end">
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      href={`/admin/billing/activate?org=${s.organizationId}`}
                    >
                      Modify
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {plans.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">
            Available plans
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="font-semibold">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.slug}
                </div>
                <div className="mt-3 font-display text-2xl font-bold">
                  {p.priceMonthlyUsd !== null
                    ? `$${p.priceMonthlyUsd}/mo`
                    : 'Custom'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
