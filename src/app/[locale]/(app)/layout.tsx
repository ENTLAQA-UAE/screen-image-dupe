import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { AppHeader } from '@/components/layout/app-header';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

/**
 * App layout — authenticated area.
 *
 * Server Component that enforces authentication. Redirects unauthenticated
 * users to /login. Fetches profile once and passes to all children via header.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect(`/${locale}/login`);
  }

  // Super admins go to a different console
  if (profile.isSuperAdmin) {
    redirect(`/${locale}/admin`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        userName={profile.fullName}
        userEmail={profile.email}
        organizationName={profile.organizationName}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
