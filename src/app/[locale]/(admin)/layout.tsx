import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { getCurrentUserProfile } from '@/lib/supabase/queries';

/**
 * Super admin layout.
 *
 * Gates all admin routes on the super_admin role. Non-super-admins
 * are redirected to the regular dashboard.
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-bold">Qudurat</span>
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              SUPER ADMIN
            </span>
          </div>
          <div className="text-sm text-muted-foreground">{profile.email}</div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
