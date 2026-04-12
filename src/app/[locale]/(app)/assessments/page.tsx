import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { AssessmentListClient } from '@/app/[locale]/(app)/assessments/assessment-list-client';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Assessments',
};

export default async function AssessmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile?.organizationId) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="p-6 lg:p-8">
      <AssessmentListClient organizationId={profile.organizationId} />
    </div>
  );
}
