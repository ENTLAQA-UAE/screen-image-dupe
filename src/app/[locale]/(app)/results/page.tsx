import { BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { AssessmentTypeBadge } from '@/components/shared/assessment-type-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listResults } from '@/lib/domain/queries';
import { Link } from '@/lib/i18n/routing';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'results' });
  return { title: t('title') };
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const t = await getTranslations('results');
  const ta = await getTranslations('assessments.types');

  const { rows, total } = await listResults(profile.organizationId);

  return (
    <div className="container py-10">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {rows.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.participant')}</TableHead>
                <TableHead>{t('columns.assessment')}</TableHead>
                <TableHead>{t('columns.type')}</TableHead>
                <TableHead className="text-end">{t('columns.score')}</TableHead>
                <TableHead>{t('columns.completed')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/results/${r.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {r.participantName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.assessmentTitle}
                  </TableCell>
                  <TableCell>
                    <AssessmentTypeBadge
                      type={r.assessmentType}
                      label={ta(r.assessmentType)}
                    />
                  </TableCell>
                  <TableCell className="text-end font-mono font-semibold">
                    {r.score !== null ? `${r.score}%` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(r.completedAt))}
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
