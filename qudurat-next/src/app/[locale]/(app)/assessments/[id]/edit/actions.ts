'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

const questionOptionSchema = z.object({
  text: z.string().trim().min(1),
  value: z.number().optional().nullable(),
  isCorrect: z.boolean().optional(),
});

const createQuestionSchema = z.object({
  assessmentId: z.string().uuid(),
  text: z.string().trim().min(3).max(2000),
  type: z.enum([
    'multiple_choice',
    'likert',
    'text',
    'situational',
    'single_select',
  ]),
  options: z.array(questionOptionSchema).min(0).max(10),
  category: z.string().trim().max(100).optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().nullable(),
});

export type QuestionActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

// ==============================================================================
// Create question
// ==============================================================================

export async function createQuestionAction(
  assessmentId: string,
  input: {
    text: string;
    type: string;
    options: Array<{ text: string; value?: number; isCorrect?: boolean }>;
    category?: string | null;
    difficulty?: 'easy' | 'medium' | 'hard' | null;
  },
): Promise<QuestionActionResult> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) {
    return { ok: false, message: 'Not authenticated' };
  }

  const parsed = createQuestionSchema.safeParse({ assessmentId, ...input });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();

  // Verify assessment ownership via RLS + get next order index
  const { data: lastQ } = await supabase
    .from('questions')
    .select('order_index')
    .eq('assessment_id', parsed.data.assessmentId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextIndex =
    ((lastQ as { order_index: number | null } | null)?.order_index ?? 0) + 1;

  const correctAnswer =
    parsed.data.type === 'multiple_choice' || parsed.data.type === 'single_select'
      ? parsed.data.options.findIndex((o) => o.isCorrect)
      : null;

  const { data, error } = await supabase
    .from('questions')
    .insert({
      assessment_id: parsed.data.assessmentId,
      text: parsed.data.text,
      type: parsed.data.type,
      options: parsed.data.options,
      correct_answer:
        correctAnswer !== null && correctAnswer >= 0 ? correctAnswer : null,
      category: parsed.data.category,
      difficulty: parsed.data.difficulty,
      order_index: nextIndex,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? 'Failed to create question' };
  }

  revalidatePath(`/[locale]/(app)/assessments/[id]/edit`, 'page');
  return { ok: true, id: (data as { id: string }).id };
}

// ==============================================================================
// Delete question
// ==============================================================================

export async function deleteQuestionAction(
  questionId: string,
): Promise<QuestionActionResult> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) {
    return { ok: false, message: 'Not authenticated' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/[locale]/(app)/assessments/[id]/edit`, 'page');
  return { ok: true };
}

// ==============================================================================
// Reorder questions
// ==============================================================================

export async function reorderQuestionsAction(
  assessmentId: string,
  orderedIds: string[],
): Promise<QuestionActionResult> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) {
    return { ok: false, message: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Verify ownership via RLS
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id')
    .eq('id', assessmentId)
    .eq('organization_id', profile.organizationId)
    .maybeSingle();

  if (!assessment) {
    return { ok: false, message: 'Assessment not found' };
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from('questions')
      .update({ order_index: i + 1 })
      .eq('id', orderedIds[i]);
  }

  revalidatePath(`/[locale]/(app)/assessments/[id]/edit`, 'page');
  return { ok: true };
}

// ==============================================================================
// Publish (draft → active)
// ==============================================================================

export async function publishAssessmentAction(
  assessmentId: string,
): Promise<QuestionActionResult> {
  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) {
    return { ok: false, message: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Must have at least 1 question
  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('assessment_id', assessmentId);

  if (!count || count === 0) {
    return {
      ok: false,
      message: 'Cannot publish an assessment with no questions',
    };
  }

  const { error } = await supabase
    .from('assessments')
    .update({ status: 'active' })
    .eq('id', assessmentId)
    .eq('organization_id', profile.organizationId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/[locale]/(app)/assessments/[id]`, 'page');
  revalidatePath(`/[locale]/(app)/assessments`, 'page');
  return { ok: true };
}
