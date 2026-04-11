import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ManualActivationForm } from '@/app/[locale]/(admin)/admin/billing/activate/manual-activation-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { listAllPlans } from '@/lib/domain/billing-queries';
import { Link } from '@/lib/i18n/routing';
import { createAdminClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Activate Subscription',
};

async function listOrganizations() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('organizations')
    .select('id, name')
    .order('name');
  return (data ?? []) as { id: string; name: string }[];
}

export default async function ActivateSubscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ org?: string; btr?: string }>;
}) {
  const { locale } = await params;
  const { org, btr } = await searchParams;
  setRequestLocale(locale);

  const [orgs, plans] = await Promise.all([listOrganizations(), listAllPlans()]);

  let preselectedBtr = null;
  if (btr) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('bank_transfer_requests')
      .select('*, plans(slug, name)')
      .eq('id', btr)
      .maybeSingle();
    if (data) {
      preselectedBtr = data as unknown as {
        organization_id: string;
        plan_id: string;
        billing_cycle: string;
        amount_usd: number;
        company_name: string;
      };
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <Link
        href="/admin/billing/subscriptions"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        Back to subscriptions
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Manually activate subscription</CardTitle>
          <CardDescription>
            For bank transfer, invoice, enterprise, or complimentary
            subscriptions. This upserts the organization&apos;s active
            subscription and creates a paid invoice record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualActivationForm
            organizations={orgs}
            plans={plans}
            defaultOrgId={org ?? preselectedBtr?.organization_id ?? undefined}
            defaultPlanId={preselectedBtr?.plan_id ?? undefined}
            defaultBillingCycle={
              (preselectedBtr?.billing_cycle as 'monthly' | 'annual') ??
              'annual'
            }
            defaultBankTransferRequestId={btr}
          />
        </CardContent>
      </Card>
    </div>
  );
}
