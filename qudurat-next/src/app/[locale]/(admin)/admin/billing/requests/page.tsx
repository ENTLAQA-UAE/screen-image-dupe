import { Clock, ExternalLink } from 'lucide-react';
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
import { listBankTransferRequests } from '@/lib/domain/billing-queries';
import { Link } from '@/lib/i18n/routing';

export const metadata: Metadata = {
  title: 'Bank Transfer Requests',
};

export default async function BankTransferRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  setRequestLocale(locale);

  const requests = await listBankTransferRequests({
    status: status ?? 'pending',
  });

  return (
    <div className="container max-w-6xl py-10">
      <PageHeader
        title="Bank Transfer Requests"
        description="Review and process offline payment requests from customers"
      />

      {/* Status filter */}
      <div className="mb-6 flex gap-2">
        {(
          [
            ['all', 'All'],
            ['pending', 'Pending'],
            ['awaiting_payment', 'Awaiting payment'],
            ['paid_confirmed', 'Confirmed'],
            ['rejected', 'Rejected'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            asChild
            variant={
              (status ?? 'pending') === value ? 'default' : 'outline'
            }
            size="sm"
          >
            <Link href={`/admin/billing/requests?status=${value}`}>
              {label}
            </Link>
          </Button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No requests in this state
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead className="text-end">Amount</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.companyName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.planName}</Badge>
                  </TableCell>
                  <TableCell className="text-sm capitalize text-muted-foreground">
                    {r.billingCycle}
                  </TableCell>
                  <TableCell className="text-end font-mono font-semibold">
                    ${r.amountUsd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.billingEmail}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === 'paid_confirmed'
                          ? 'success'
                          : r.status === 'rejected'
                            ? 'destructive'
                            : r.status === 'awaiting_payment'
                              ? 'warning'
                              : 'default'
                      }
                    >
                      {r.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(r.createdAt))}
                  </TableCell>
                  <TableCell className="text-end">
                    {r.status === 'pending' ||
                    r.status === 'awaiting_payment' ? (
                      <Button asChild size="sm">
                        <Link href={`/admin/billing/activate?btr=${r.id}`}>
                          Activate
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        —
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
