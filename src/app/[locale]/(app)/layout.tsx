import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/sidebar';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

/**
 * App layout — authenticated area with sidebar + header.
 *
 * Server Component that enforces authentication, determines the user's
 * role, and renders the sidebar with role-appropriate navigation.
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

  if (profile.isSuperAdmin) {
    redirect(`/${locale}/admin`);
  }

  const role = profile.isOrgAdmin ? 'org_admin' : 'hr_admin';
  const roleLabel = profile.isOrgAdmin ? 'Org Admin' : 'HR Admin';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar
        userName={profile.fullName}
        userEmail={profile.email}
        userRole={roleLabel}
        organizationName={profile.organizationName}
        organizationLogo={null}
        role={role}
      />

      {/* Main content area — offset by sidebar width */}
      <div className="flex flex-1 flex-col transition-all duration-300 ms-[var(--sidebar-width)]">
        <AppHeader
          userName={profile.fullName}
          userEmail={profile.email}
          organizationName={profile.organizationName}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
