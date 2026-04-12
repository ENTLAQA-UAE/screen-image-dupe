import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { GroupsListClient } from '@/app/[locale]/(app)/groups/groups-list-client';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Assessment Groups',
};

export default async function GroupsPage({
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
      <GroupsListClient organizationId={profile.organizationId} />
    </div>
  );
}
