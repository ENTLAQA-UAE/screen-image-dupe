import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { AssessmentBuilderClient } from '@/app/[locale]/(app)/assessments/new/assessment-builder-client';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Create Assessment',
};

export default async function NewAssessmentPage({
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
      <AssessmentBuilderClient
        organizationId={profile.organizationId}
        userId={profile.id}
        locale={locale}
      />
    </div>
  );
}
