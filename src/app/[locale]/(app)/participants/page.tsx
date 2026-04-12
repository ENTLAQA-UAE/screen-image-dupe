import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ParticipantsClient } from '@/app/[locale]/(app)/participants/participants-client';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Participants',
};

export default async function ParticipantsPage({
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
      <ParticipantsClient organizationId={profile.organizationId} />
    </div>
  );
}
