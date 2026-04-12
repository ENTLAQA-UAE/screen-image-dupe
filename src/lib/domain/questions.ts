import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface Question {
  id: string;
  assessmentId: string;
  text: string;
  type: string;
  options: Array<{ text: string; value?: number; isCorrect?: boolean }>;
  correctAnswer: string | number | null;
  category: string | null;
  difficulty: string | null;
  orderIndex: number;
  createdAt: string;
}

export async function listQuestionsForAssessment(
  organizationId: string,
  assessmentId: string,
): Promise<Question[]> {
  const supabase = await createClient();

  // First verify the assessment belongs to this org (RLS will also enforce)
  const { data: assessmentCheck } = await supabase
    .from('assessments')
    .select('id')
    .eq('id', assessmentId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!assessmentCheck) return [];

  const { data, error } = await supabase
    .from('questions')
    .select(
      'id, assessment_id, text, type, options, correct_answer, category, difficulty, order_index, created_at',
    )
    .eq('assessment_id', assessmentId)
    .order('order_index', { ascending: true });

  if (error) return [];

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      assessment_id: string;
      text: string;
      type: string;
      options: unknown;
      correct_answer: unknown;
      category: string | null;
      difficulty: string | null;
      order_index: number | null;
      created_at: string;
    };
    return {
      id: r.id,
      assessmentId: r.assessment_id,
      text: r.text,
      type: r.type,
      options: Array.isArray(r.options)
        ? (r.options as Array<{
            text: string;
            value?: number;
            isCorrect?: boolean;
          }>)
        : [],
      correctAnswer: (r.correct_answer as string | number | null) ?? null,
      category: r.category,
      difficulty: r.difficulty,
      orderIndex: r.order_index ?? 0,
      createdAt: r.created_at,
    };
  });
}
