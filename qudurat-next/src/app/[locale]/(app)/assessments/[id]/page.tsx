import { ArrowLeft, Edit, Eye } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AssessmentTypeIcon } from '@/components/shared/assessment-type-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAssessment } from '@/lib/domain/queries';
import { Link } from '@/lib/i18n/routing';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) return { title: 'Assessment' };
  const assessment = await getAssessment(profile.organizationId, id);
  return { title: assessment?.title ?? 'Assessment' };
}

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const assessment = await getAssessment(profile.organizationId, id);
  if (!assessment) notFound();

  const t = await getTranslations('assessments');

  return (
    <div className="container max-w-4xl py-10">
      <Link
        href="/assessments"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        Back to assessments
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <AssessmentTypeIcon type={assessment.type} size="lg" />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {assessment.title}
            </h1>
            {assessment.description && (
              <p className="mt-2 text-muted-foreground">
                {assessment.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Badge
                variant={
                  assessment.status === 'active'
                    ? 'success'
                    : assessment.status === 'archived'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {t(`status.${assessment.status}`)}
              </Badge>
              <Badge variant="outline">{t(`types.${assessment.type}`)}</Badge>
              <Badge variant="outline" className="uppercase">
                {assessment.language}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/assessments/${assessment.id}/preview`}>
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/assessments/${assessment.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold">
              {assessment.questionCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-xl font-semibold capitalize">
              {assessment.category.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(new Date(assessment.createdAt))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Assessment Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The full builder UI (question editor, drag-to-reorder, AI
            generation, live preview) will be migrated in Phase 1 Week 5 along
            with the Taker split. For now, use the legacy Vite app at{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              /assessment-builder/{assessment.id}
            </code>{' '}
            to manage questions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
