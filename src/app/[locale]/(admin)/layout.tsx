import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/sidebar';
import { getCurrentUserProfile } from '@/lib/supabase/queries';

/**
 * Super admin layout with sidebar.
 */
export default async function AdminLayout({
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
  if (!profile.isSuperAdmin) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        userName={profile.fullName}
        userEmail={profile.email}
        userRole="Super Admin"
        organizationName="Qudurat Platform"
        organizationLogo={null}
        role="super_admin"
      />

      <div className="flex flex-1 flex-col transition-all duration-300 ms-[var(--sidebar-width)]">
        <AppHeader
          userName={profile.fullName}
          userEmail={profile.email}
          organizationName={null}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
