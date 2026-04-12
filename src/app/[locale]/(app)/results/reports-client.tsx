'use client';

import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface GroupSummary {
  id: string;
  name: string;
  assessmentTitle: string;
  assessmentType: string;
  isActive: boolean;
  participantCount: number;
  completedCount: number;
  avgScore: number | null;
}

const COLORS = ['#0D9488', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function ReportsClient({ organizationId }: { organizationId: string }) {
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    activeGroups: 0,
    totalParticipants: 0,
    completedParticipants: 0,
    avgScore: null as number | null,
  });

  const fetchData = useCallback(async () => {
    // Fetch groups with participant counts
    const { data: groupData } = await supabase
      .from('assessment_groups')
      .select('id, name, is_active, assessments(title, type)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    const groupSummaries: GroupSummary[] = [];
    let totalParticipants = 0;
    let completedParticipants = 0;
    const allScores: number[] = [];

    for (const g of groupData ?? []) {
      const assessment = g.assessments as unknown as { title: string; type: string } | null;

      const { count: total } = await supabase
        .from('participants')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', g.id);

      const { data: completedData } = await supabase
        .from('participants')
        .select('score_summary')
        .eq('group_id', g.id)
        .eq('status', 'completed');

      const completed = completedData?.length ?? 0;
      totalParticipants += total ?? 0;
      completedParticipants += completed;

      const scores = (completedData ?? [])
        .map((p) => {
          const s = p.score_summary as { percentage?: number; total_score?: number } | null;
          return s?.percentage ?? s?.total_score ?? null;
        })
        .filter((s): s is number => typeof s === 'number');

      scores.forEach((s) => allScores.push(s));

      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;

      groupSummaries.push({
        id: g.id,
        name: g.name,
        assessmentTitle: assessment?.title ?? '',
        assessmentType: assessment?.type ?? '',
        isActive: !!g.is_active,
        participantCount: total ?? 0,
        completedCount: completed,
        avgScore,
      });
    }

    const { count: assessmentCount } = await supabase
      .from('assessments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    setGroups(groupSummaries);
    setStats({
      totalAssessments: assessmentCount ?? 0,
      activeGroups: groupSummaries.filter((g) => g.isActive).length,
      totalParticipants,
      completedParticipants,
      avgScore:
        allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : null,
    });
    setLoading(false);
  }, [supabase, organizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart data
  const completionData = groups
    .filter((g) => g.participantCount > 0)
    .map((g) => ({
      name: g.name.slice(0, 15),
      completed: g.completedCount,
      total: g.participantCount,
      rate: Math.round((g.completedCount / g.participantCount) * 100),
    }));

  const typeDistribution = (() => {
    const counts: Record<string, number> = {};
    groups.forEach((g) => {
      const t = g.assessmentType || 'other';
      counts[t] = (counts[t] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization-wide assessment performance overview
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Assessments"
          value={stats.totalAssessments.toString()}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Users}
          label="Total Participants"
          value={stats.totalParticipants.toString()}
          sub={`${stats.completedParticipants} completed`}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completion Rate"
          value={
            stats.totalParticipants > 0
              ? `${Math.round((stats.completedParticipants / stats.totalParticipants) * 100)}%`
              : '—'
          }
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
          color="bg-violet-100 text-violet-600"
        />
      </div>

      {/* Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Completion by group */}
        {completionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completion by Group</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#0D9488" name="Completed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" fill="#E5E7EB" name="Total" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment type distribution */}
        {typeDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assessment Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#0D9488"
                      dataKey="value"
                    >
                      {typeDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Group summaries table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Group Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {groups.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No groups yet
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Group</th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assessment</th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">Participants</th>
                  <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Score</th>
                  <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="px-6 py-3 font-medium">{g.name}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{g.assessmentTitle}</td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium',
                        g.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600',
                      )}>
                        {g.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-end text-sm">
                      {g.completedCount} / {g.participantCount}
                      {g.participantCount > 0 && (
                        <span className="ms-1 text-xs text-muted-foreground">
                          ({Math.round((g.completedCount / g.participantCount) * 100)}%)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-end font-mono text-sm">
                      {g.avgScore !== null ? `${g.avgScore}%` : '—'}
                    </td>
                    <td className="px-6 py-3 text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/${locale}/groups/${g.id}/report`)}
                      >
                        View report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className={cn('icon-container', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-4">
          <div className="stat-value">{value}</div>
          <div className="stat-label mt-1">{label}</div>
          {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
