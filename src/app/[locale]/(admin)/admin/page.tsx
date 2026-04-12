import {
  Building2,
  CreditCard,
  FileText,
  Globe,
  Receipt,
  ShieldAlert,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from '@/lib/i18n/routing';
import { createAdminClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Super Admin Console',
};

async function getPlatformStats() {
  const supabase = createAdminClient();

  const [orgsRes, usersRes, assessmentsRes, domainsRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('assessments')
      .select('id', { count: 'exact', head: true }),
  ]);

  // tenant_custom_domains may not exist if Week 9 migration wasn't run
  let customDomainCount = 0;
  try {
    const domainsRes = await supabase
      .from('tenant_custom_domains')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'verified');
    customDomainCount = domainsRes.count ?? 0;
  } catch {
    // Table doesn't exist yet — that's fine
  }

  return {
    organizations: orgsRes.count ?? 0,
    users: usersRes.count ?? 0,
    assessments: assessmentsRes.count ?? 0,
    customDomains: customDomainCount,
  };
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const stats = await getPlatformStats();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Platform overview
        </h1>
        <p className="mt-1 text-muted-foreground">
          Cross-tenant metrics and system health
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Organizations"
          value={stats.organizations.toString()}
          icon={Building2}
        />
        <StatCard
          label="Users"
          value={stats.users.toString()}
          icon={Users}
        />
        <StatCard
          label="Assessments"
          value={stats.assessments.toString()}
          icon={ShieldAlert}
        />
        <StatCard
          label="Custom domains"
          value={stats.customDomains.toString()}
          icon={Globe}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-display text-xl font-semibold">
          Billing & subscriptions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ModuleCard
            href="/admin/billing/providers"
            icon={CreditCard}
            title="Payment providers"
            description="Configure Stripe and bank transfer details"
          />
          <ModuleCard
            href="/admin/billing/subscriptions"
            icon={Receipt}
            title="All subscriptions"
            description="Cross-tenant subscription management"
          />
          <ModuleCard
            href="/admin/billing/requests"
            icon={FileText}
            title="Bank transfer requests"
            description="Review and activate offline payment requests"
          />
          <ModuleCard
            href="/admin/billing/activate"
            icon={ShieldAlert}
            title="Manual activation"
            description="Activate enterprise or complimentary subscriptions"
          />
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Admin modules (coming in Phase 2)</CardTitle>
          <CardDescription>
            The following super-admin views will be built out in Phase 2
            alongside tenant self-service features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Cross-tenant organizations list with filters</li>
            <li>• User management and role assignment</li>
            <li>• Custom domain registry with DNS status</li>
            <li>• Audit log timeline</li>
            <li>• Edge function logs and performance</li>
            <li>• Feature flags</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ModuleCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="h-auto flex-col items-start gap-2 p-5 text-start"
    >
      <Link href={href}>
        <Icon className="h-5 w-5 text-primary" />
        <div className="font-semibold">{title}</div>
        <div className="text-xs font-normal text-muted-foreground">
          {description}
        </div>
      </Link>
    </Button>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
