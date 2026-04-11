import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

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

/**
 * Dashboard — Server Component.
 *
 * Fetches data server-side and renders without a client-side loading spinner.
 * Demonstrates the pattern for all future authenticated pages.
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');

  // Tenant context injected by middleware
  const tenant = await getTenantFromHeaders();

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
        {tenant && (
          <p className="mt-2 text-xs text-muted-foreground">
            Tenant: {tenant.subdomain ?? tenant.id} • Plan: {tenant.plan}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('stats.totalAssessments')} value="—" />
        <StatCard label={t('stats.activeParticipants')} value="—" />
        <StatCard label={t('stats.completionRate')} value="—" />
        <StatCard label={t('stats.avgScore')} value="—" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-foreground">
        {value}
      </div>
    </div>
  );
}
