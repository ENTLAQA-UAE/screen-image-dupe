import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { createClient } from '@/lib/supabase/server';

/**
 * App layout — authenticated area.
 *
 * Server Component that enforces authentication. Redirects unauthenticated
 * users to /login. All child routes are guaranteed to have a user session.
 *
 * TODO (Week 3): Add sidebar navigation and header with user menu.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-display text-xl font-bold">Qudurat</div>
          <nav className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">{user.email}</span>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
