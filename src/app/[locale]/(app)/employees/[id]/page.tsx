import {
  ArrowLeft,
  Award,
  Briefcase,
  Building2,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';
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
import { Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Employee profile',
};

async function getEmployee(organizationId: string, employeeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('participants')
    .select(
      'id, full_name, email, employee_code, department, job_title, created_at',
    )
    .eq('organization_id', organizationId)
    .eq('id', employeeId)
    .maybeSingle();

  if (error || !data) return null;

  const r = data as unknown as {
    id: string;
    full_name: string;
    email: string;
    employee_code: string | null;
    department: string | null;
    job_title: string | null;
    created_at: string;
  };

  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    employeeCode: r.employee_code,
    department: r.department,
    jobTitle: r.job_title,
    createdAt: r.created_at,
  };
}

async function getEmployeeAssessmentHistory(
  organizationId: string,
  employeeEmail: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('participants')
    .select(
      'id, status, score_summary, completed_at, created_at, assessment_groups!inner(name, assessments!inner(id, title, type))',
    )
    .eq('organization_id', organizationId)
    .eq('email', employeeEmail)
    .order('completed_at', { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      status: string;
      score_summary: unknown;
      completed_at: string | null;
      created_at: string;
      assessment_groups: {
        name: string;
        assessments: { id: string; title: string; type: string };
      };
    };
    return {
      id: r.id,
      groupName: r.assessment_groups.name,
      assessmentId: r.assessment_groups.assessments.id,
      assessmentTitle: r.assessment_groups.assessments.title,
      assessmentType: r.assessment_groups.assessments.type,
      status: r.status,
      score: (() => {
        const s = r.score_summary as { percentage?: number; total_score?: number } | null;
        return s?.percentage ?? s?.total_score ?? null;
      })(),
      completedAt: r.completed_at,
      createdAt: r.created_at,
    };
  });
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const employee = await getEmployee(profile.organizationId, id);
  if (!employee) notFound();

  const history = await getEmployeeAssessmentHistory(
    profile.organizationId,
    employee.email,
  );

  const completedCount = history.filter((h) => h.status === 'completed').length;
  const scores = history
    .filter((h) => h.status === 'completed' && h.score !== null)
    .map((h) => h.score as number);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <Link
        href="/employees"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        Back to employees
      </Link>

      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                {employee.fullName}
              </h1>
              <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <InfoRow icon={Mail} value={employee.email} />
                {employee.employeeCode && (
                  <InfoRow
                    icon={Building2}
                    value={`#${employee.employeeCode}`}
                    mono
                  />
                )}
                {employee.jobTitle && (
                  <InfoRow icon={Briefcase} value={employee.jobTitle} />
                )}
                {employee.department && (
                  <InfoRow icon={Building2} value={employee.department} />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                Joined{' '}
                {new Intl.DateTimeFormat(locale, {
                  year: 'numeric',
                  month: 'short',
                }).format(new Date(employee.createdAt))}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold">
              {history.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold">
              {completedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold">
              {avgScore !== null ? `${avgScore}%` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Talent snapshot placeholder */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI talent snapshot
              </CardTitle>
              <CardDescription>
                Comprehensive personality and skills analysis across all
                completed assessments
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled={completedCount === 0}>
              <Award className="h-4 w-4" />
              Generate snapshot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-6 w-6" />
            AI talent snapshot requires the tenant AI provider system from
            Phase 2 Week 8. The existing edge function{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              generate-talent-snapshot
            </code>{' '}
            is ready and will be wired up once each tenant can configure
            their own OpenAI / Anthropic / Gemini key.
          </div>
        </CardContent>
      </Card>

      {/* Assessment history */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment history</CardTitle>
          <CardDescription>
            All assessments this employee has been invited to
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No assessment history yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">
                      {h.assessmentTitle}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {h.assessmentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {h.groupName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          h.status === 'completed'
                            ? 'success'
                            : h.status === 'abandoned'
                              ? 'destructive'
                              : 'outline'
                        }
                      >
                        {h.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-mono font-semibold">
                      {h.score !== null ? `${h.score}%` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {h.completedAt
                        ? new Intl.DateTimeFormat(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }).format(new Date(h.completedAt))
                        : new Intl.DateTimeFormat(locale, {
                            month: 'short',
                            day: 'numeric',
                          }).format(new Date(h.createdAt))}
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

function InfoRow({
  icon: Icon,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  );
}
