import { FileText } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { AssessmentTypeBadge } from '@/components/shared/assessment-type-icon';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

import type { AssessmentType } from '@/lib/domain/types';

export const metadata: Metadata = {
  title: 'Question bank',
};

interface BankEntry {
  id: string;
  text: string;
  type: string;
  category: string | null;
  difficulty: string | null;
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: AssessmentType;
}

async function listQuestionBank(
  organizationId: string,
): Promise<BankEntry[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('questions')
    .select(
      'id, text, type, category, difficulty, assessment_id, assessments!inner(id, title, type, organization_id)',
    )
    .eq('assessments.organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(500);

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      text: string;
      type: string;
      category: string | null;
      difficulty: string | null;
      assessment_id: string;
      assessments: { id: string; title: string; type: string };
    };
    return {
      id: r.id,
      text: r.text,
      type: r.type,
      category: r.category,
      difficulty: r.difficulty,
      assessmentId: r.assessment_id,
      assessmentTitle: r.assessments.title,
      assessmentType: r.assessments.type as AssessmentType,
    };
  });
}

export default async function QuestionBankPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) redirect(`/${locale}/login`);

  const questions = await listQuestionBank(profile.organizationId);

  return (
    <div className="container py-10">
      <PageHeader
        title="Question bank"
        description="Browse all questions across your assessments"
      />

      <div className="mb-4 text-sm text-muted-foreground">
        {questions.length} question{questions.length !== 1 ? 's' : ''} across
        your organization
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No questions yet"
          description="Questions will appear here as you create them in your assessments."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Assessment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-md">
                    <div className="line-clamp-2 font-medium">{q.text}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {q.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {q.category ?? '—'}
                  </TableCell>
                  <TableCell>
                    {q.difficulty ? (
                      <Badge
                        variant={
                          q.difficulty === 'easy'
                            ? 'success'
                            : q.difficulty === 'hard'
                              ? 'destructive'
                              : 'default'
                        }
                      >
                        {q.difficulty}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <AssessmentTypeBadge
                      type={q.assessmentType}
                      label={q.assessmentTitle}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
