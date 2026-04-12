import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { QuestionBuilder } from '@/app/[locale]/(app)/assessments/[id]/edit/question-builder';
import { Badge } from '@/components/ui/badge';
import { getAssessment } from '@/lib/domain/queries';
import { listQuestionsForAssessment } from '@/lib/domain/questions';
import { Link } from '@/lib/i18n/routing';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) return { title: 'Edit assessment' };
  const a = await getAssessment(profile.organizationId, id);
  return { title: a ? `Edit · ${a.title}` : 'Edit assessment' };
}

export default async function EditAssessmentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const [assessment, questions] = await Promise.all([
    getAssessment(profile.organizationId, id),
    listQuestionsForAssessment(profile.organizationId, id),
  ]);

  if (!assessment) notFound();

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <Link
        href={`/assessments/${assessment.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        Back to assessment
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {assessment.title}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Edit questions and publish when ready
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={
              assessment.status === 'active'
                ? 'success'
                : assessment.status === 'archived'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {assessment.status}
          </Badge>
          <Badge variant="outline">{questions.length} questions</Badge>
        </div>
      </div>

      <QuestionBuilder
        assessmentId={assessment.id}
        assessmentType={assessment.type}
        assessmentStatus={assessment.status}
        initialQuestions={questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          orderIndex: q.orderIndex,
        }))}
      />
    </div>
  );
}
