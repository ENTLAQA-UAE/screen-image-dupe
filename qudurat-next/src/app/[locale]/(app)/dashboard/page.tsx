import {
  BarChart3,
  CheckCircle,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/lib/i18n/routing';
import {
  getCurrentUserProfile,
  getDashboardStats,
} from '@/lib/supabase/queries';
import { getTenantFromHeaders } from '@/lib/tenant/context';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  return { title: t('title') };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const profile = await getCurrentUserProfile();
  const tenant = await getTenantFromHeaders();

  if (!profile || !profile.organizationId) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">No organization assigned.</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {/* Welcome header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('dashboard.welcome', { name: profile.fullName })}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
          {tenant && (
            <p className="mt-2 text-xs text-muted-foreground">
              Tenant: {tenant.subdomain ?? tenant.id} • Plan: {tenant.plan}
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid organizationId={profile.organizationId} />
      </Suspense>

      {/* Quick actions */}
      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold">
          {t('dashboard.quickActions.title')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            href="/assessments/new"
            icon={FileText}
            title={t('dashboard.quickActions.createAssessment')}
          />
          <QuickActionCard
            href="/groups/new"
            icon={Users}
            title={t('dashboard.quickActions.createGroup')}
          />
          <QuickActionCard
            href="/employees/new"
            icon={Users}
            title={t('dashboard.quickActions.inviteParticipant')}
          />
          <QuickActionCard
            href="/results"
            icon={BarChart3}
            title={t('dashboard.quickActions.viewResults')}
          />
        </div>
      </div>
    </div>
  );
}

async function StatsGrid({ organizationId }: { organizationId: string }) {
  const stats = await getDashboardStats(organizationId);
  const t = await getTranslations('dashboard.stats');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t('totalAssessments')}
        value={stats.totalAssessments.toString()}
        icon={FileText}
      />
      <StatCard
        label={t('activeParticipants')}
        value={stats.activeParticipants.toString()}
        icon={Users}
      />
      <StatCard
        label={t('completionRate')}
        value={`${stats.completionRate}%`}
        icon={CheckCircle}
      />
      <StatCard
        label={t('avgScore')}
        value={stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
        icon={TrendingUp}
      />
    </div>
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
    <Card className="transition-all hover:shadow-md">
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

function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="h-auto flex-col items-start gap-2 p-5 text-start"
    >
      <Link href={href}>
        <Icon className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">{title}</span>
      </Link>
    </Button>
  );
}
