'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { canCreate, LimitExceededError } from '@/lib/domain/limits';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

const createAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  type: z.enum([
    'cognitive',
    'personality',
    'situational',
    'behavioral',
    'language',
    'custom',
  ]),
  language: z.enum(['en', 'ar', 'both']),
  isGraded: z.boolean(),
});

export type CreateAssessmentResult =
  | { ok: true; id: string }
  | { ok: false; errors: Record<string, string>; message?: string };

export async function createAssessmentAction(
  _prev: CreateAssessmentResult | null,
  formData: FormData,
): Promise<CreateAssessmentResult> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.organizationId) {
    return { ok: false, errors: {}, message: 'Not authenticated' };
  }

  const parsed = createAssessmentSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || null,
    type: formData.get('type'),
    language: formData.get('language'),
    isGraded: formData.get('isGraded') === 'on',
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const err of parsed.error.errors) {
      if (err.path[0]) errors[err.path[0] as string] = err.message;
    }
    return { ok: false, errors };
  }

  // Enforce subscription limit before insert
  const allowed = await canCreate(profile.organizationId, 'assessments');
  if (!allowed) {
    return {
      ok: false,
      errors: {},
      message: new LimitExceededError('assessments').message,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      organization_id: profile.organizationId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      language: parsed.data.language,
      is_graded: parsed.data.isGraded,
      category: parsed.data.isGraded ? 'graded_quiz' : 'profile',
      status: 'draft',
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (error || !data) {
    return {
      ok: false,
      errors: {},
      message: error?.message ?? 'Failed to create assessment',
    };
  }

  revalidatePath('/[locale]/(app)/assessments', 'page');
  const locale = (formData.get('locale') as string) ?? 'en';
  redirect(`/${locale}/assessments/${(data as { id: string }).id}`);
}

export async function archiveAssessmentAction(
  assessmentId: string,
  locale: string = 'en',
): Promise<void> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.organizationId) return;

  const supabase = await createClient();
  await supabase
    .from('assessments')
    .update({ status: 'archived' })
    .eq('id', assessmentId)
    .eq('organization_id', profile.organizationId);

  revalidatePath(`/${locale}/assessments`);
}

export async function deleteAssessmentAction(
  assessmentId: string,
  locale: string = 'en',
): Promise<void> {
  const profile = await getCurrentUserProfile();
  if (!profile || !profile.organizationId) return;

  const supabase = await createClient();
  await supabase
    .from('assessments')
    .delete()
    .eq('id', assessmentId)
    .eq('organization_id', profile.organizationId);

  revalidatePath(`/${locale}/assessments`);
  redirect(`/${locale}/assessments`);
}
