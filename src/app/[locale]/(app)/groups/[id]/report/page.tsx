import { ArrowLeft, BarChart3, Sparkles, TrendingUp, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { getGroup, listParticipantsInGroup } from '@/lib/domain/queries';
import { Link } from '@/lib/i18n/routing';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Group report',
};

export default async function GroupReportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const [group, participants] = await Promise.all([
    getGroup(profile.organizationId, id),
    listParticipantsInGroup(profile.organizationId, id),
  ]);

  if (!group) notFound();

  const completed = participants.filter((p) => p.status === 'completed');
  const scores = completed
    .map((p) => p.score)
    .filter((s): s is number => typeof s === 'number');
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;
  const minScore = scores.length > 0 ? Math.min(...scores) : null;

  // Score distribution buckets
  const buckets = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
  for (const s of scores) {
    const bucketIdx = Math.min(Math.floor(s / 20), 4);
    if (bucketIdx >= 0 && bucketIdx < 5) {
      buckets[bucketIdx]! += 1;
    }
  }
  const maxBucket = Math.max(...buckets, 1);

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <Link
        href={`/groups/${group.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        Back to group
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Group report
          </h1>
          <Badge variant="outline">{group.name}</Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          Assessment: <strong>{group.assessmentTitle}</strong>
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completed"
          value={completed.length.toString()}
          total={participants.length}
          icon={Users}
        />
        <StatCard
          label="Average score"
          value={avgScore !== null ? `${avgScore}%` : '—'}
          icon={TrendingUp}
        />
        <StatCard
          label="Highest score"
          value={maxScore !== null ? `${maxScore}%` : '—'}
          icon={BarChart3}
        />
        <StatCard
          label="Lowest score"
          value={minScore !== null ? `${minScore}%` : '—'}
          icon={BarChart3}
        />
      </div>

      {/* Score distribution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Score distribution</CardTitle>
          <CardDescription>
            {completed.length} participants across 5 score bands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              ['0–20%', buckets[0]!],
              ['20–40%', buckets[1]!],
              ['40–60%', buckets[2]!],
              ['60–80%', buckets[3]!],
              ['80–100%', buckets[4]!],
            ].map(([label, count]) => (
              <div key={label as string} className="flex items-center gap-3">
                <span className="w-16 text-xs font-mono text-muted-foreground">
                  {label}
                </span>
                <div className="flex-1">
                  <div className="h-6 rounded-full bg-muted">
                    <div
                      className="flex h-full items-center justify-end rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground transition-all"
                      style={{
                        width: `${((count as number) / maxBucket) * 100}%`,
                        minWidth: (count as number) > 0 ? '2.5rem' : '0',
                      }}
                    >
                      {(count as number) > 0 && (count as number)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI narrative placeholder */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI group narrative
              </CardTitle>
              <CardDescription>
                Auto-generated insights about this cohort
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              Generate narrative
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-6 w-6" />
            AI narrative generation will be wired up in Phase 2 Week 8 when
            the tenant AI provider system is complete. The existing edge
            function{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              generate-group-narrative
            </code>{' '}
            is ready but needs the per-tenant provider config to know which
            LLM to call.
          </div>
        </CardContent>
      </Card>

      {/* Participants with scores */}
      <Card>
        <CardHeader>
          <CardTitle>Participant results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {completed.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No completed submissions yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-end">Score</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...completed]
                  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                  .map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">
                        #{i + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.fullName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.email}
                      </TableCell>
                      <TableCell className="text-end font-mono font-semibold">
                        {p.score !== null ? `${p.score}%` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.completedAt
                          ? new Intl.DateTimeFormat(locale, {
                              month: 'short',
                              day: 'numeric',
                            }).format(new Date(p.completedAt))
                          : '—'}
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

function StatCard({
  label,
  value,
  total,
  icon: Icon,
}: {
  label: string;
  value: string;
  total?: number;
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
        {total !== undefined && (
          <div className="text-xs text-muted-foreground">of {total} total</div>
        )}
      </CardContent>
    </Card>
  );
}
