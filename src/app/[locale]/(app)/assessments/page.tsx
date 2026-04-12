import { FileText, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import {
  AssessmentTypeBadge,
  AssessmentTypeIcon,
} from '@/components/shared/assessment-type-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listAssessments } from '@/lib/domain/queries';
import { Link } from '@/lib/i18n/routing';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'assessments' });
  return { title: t('title') };
}

export default async function AssessmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
}) {
  const { locale } = await params;
  const { q, type, status } = await searchParams;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations('assessments');
  const tc = await getTranslations('common');

  const { rows, total } = await listAssessments(profile.organizationId, {
    search: q,
    type,
    status,
  });

  return (
    <div className="container py-10">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <Button asChild>
            <Link href="/assessments/new">
              <Plus className="h-4 w-4" />
              {t('new')}
            </Link>
          </Button>
        }
      />

      {/* Filter bar */}
      <form className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input
          name="q"
          placeholder={tc('search')}
          defaultValue={q}
          className="max-w-xs"
        />
        <select
          name="type"
          defaultValue={type ?? 'all'}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">{tc('all')}</option>
          <option value="cognitive">{t('types.cognitive')}</option>
          <option value="personality">{t('types.personality')}</option>
          <option value="situational">{t('types.situational')}</option>
          <option value="behavioral">{t('types.behavioral')}</option>
          <option value="language">{t('types.language')}</option>
        </select>
        <select
          name="status"
          defaultValue={status ?? 'all'}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">{tc('all')}</option>
          <option value="draft">{t('status.draft')}</option>
          <option value="active">{t('status.active')}</option>
          <option value="archived">{t('status.archived')}</option>
        </select>
        <Button type="submit" variant="outline">
          {tc('filter')}
        </Button>
      </form>

      {/* Empty state */}
      {rows.length === 0 && (
        <EmptyState
          icon={FileText}
          title={t('empty.title')}
          description={t('empty.description')}
          action={
            <Button asChild>
              <Link href="/assessments/new">
                <Plus className="h-4 w-4" />
                {t('empty.cta')}
              </Link>
            </Button>
          }
        />
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.title')}</TableHead>
                <TableHead>{t('columns.type')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead>{t('columns.language')}</TableHead>
                <TableHead className="text-end">
                  {t('columns.questions')}
                </TableHead>
                <TableHead>{t('columns.created')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link
                      href={`/assessments/${a.id}`}
                      className="group flex items-center gap-3"
                    >
                      <AssessmentTypeIcon type={a.type} size="sm" />
                      <div>
                        <div className="font-medium group-hover:text-primary">
                          {a.title}
                        </div>
                        {a.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {a.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <AssessmentTypeBadge
                      type={a.type}
                      label={t(`types.${a.type}`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.status === 'active'
                          ? 'success'
                          : a.status === 'archived'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {t(`status.${a.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm uppercase text-muted-foreground">
                    {a.language}
                  </TableCell>
                  <TableCell className="text-end font-mono text-sm">
                    {a.questionCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.createdAt
                      ? new Intl.DateTimeFormat(locale, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(a.createdAt))
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {rows.length} of {total}
        </div>
      )}
    </div>
  );
}
