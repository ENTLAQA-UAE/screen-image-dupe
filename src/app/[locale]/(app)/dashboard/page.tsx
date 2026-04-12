import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  FileText,
  FolderKanban,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/lib/i18n/routing';
import {
  getCurrentUserProfile,
  getDashboardStats,
} from '@/lib/supabase/queries';

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

  if (!profile || !profile.organizationId) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No organization assigned.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {t('dashboard.welcome', { name: profile.fullName })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats grid */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid organizationId={profile.organizationId} />
      </Suspense>

      {/* Quick Actions + Getting Started */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              {t('dashboard.quickActions.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction
                href="/assessments/new"
                icon={FileText}
                title={t('dashboard.quickActions.createAssessment')}
                description="Design a new assessment with AI"
              />
              <QuickAction
                href="/groups"
                icon={FolderKanban}
                title={t('dashboard.quickActions.createGroup')}
                description="Organize participants into groups"
              />
              <QuickAction
                href="/employees"
                icon={Users}
                title={t('dashboard.quickActions.inviteParticipant')}
                description="Invite and manage employees"
              />
              <QuickAction
                href="/results"
                icon={BarChart3}
                title={t('dashboard.quickActions.viewResults')}
                description="View scores and AI insights"
              />
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ChecklistItem done label="Create your account" />
              <ChecklistItem done={false} label="Create first assessment" />
              <ChecklistItem done={false} label="Invite participants" />
              <ChecklistItem done={false} label="Configure email provider" />
              <ChecklistItem done={false} label="Review first results" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==============================================================================
// Sub-components
// ==============================================================================

async function StatsGrid({ organizationId }: { organizationId: string }) {
  const stats = await getDashboardStats(organizationId);
  const t = await getTranslations('dashboard.stats');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Hero card — gradient */}
      <Card className="bg-gradient-primary text-white shadow-lg shadow-primary/20 sm:col-span-2 lg:col-span-1">
        <CardContent className="p-6">
          <div className="icon-container bg-white/20 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <div className="stat-value text-white">
              {stats.totalAssessments}
            </div>
            <div className="mt-1 text-sm text-teal-100">
              {t('totalAssessments')}
            </div>
          </div>
        </CardContent>
      </Card>

      <StatCard
        label={t('activeParticipants')}
        value={stats.activeParticipants.toString()}
        icon={Users}
        iconBg="bg-blue-100 text-blue-600"
      />
      <StatCard
        label={t('completionRate')}
        value={`${stats.completionRate}%`}
        icon={CheckCircle}
        iconBg="bg-emerald-100 text-emerald-600"
      />
      <StatCard
        label={t('avgScore')}
        value={stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
        icon={TrendingUp}
        iconBg="bg-amber-100 text-amber-600"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className={`icon-container ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-4">
          <div className="stat-value">{value}</div>
          <div className="stat-label mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
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
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
    >
      <div className="icon-container bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
    </Link>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
          done
            ? 'bg-primary text-primary-foreground'
            : 'border-2 border-border'
        }`}
      >
        {done && <CheckCircle className="h-3 w-3" />}
      </div>
      <span
        className={`text-sm ${done ? 'text-muted-foreground line-through' : 'font-medium'}`}
      >
        {label}
      </span>
    </div>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-2 h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
