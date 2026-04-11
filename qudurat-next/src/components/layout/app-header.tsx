'use client';

import { LogOut, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { logoutAction } from '@/app/[locale]/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';

interface AppHeaderProps {
  userName: string;
  userEmail: string;
  organizationName: string | null;
}

export function AppHeader({
  userName,
  userEmail,
  organizationName,
}: AppHeaderProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction(locale);
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-display text-xl font-bold tracking-tight"
          >
            <span className="text-primary">Qudurat</span>
          </Link>
          {organizationName && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm font-medium text-muted-foreground">
                {organizationName}
              </span>
            </>
          )}
        </div>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="/dashboard"
            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/assessments"
            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Assessments
          </Link>
          <Link
            href="/groups"
            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Groups
          </Link>
          <Link
            href="/employees"
            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Employees
          </Link>
          <Link
            href="/results"
            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Results
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden text-start sm:block">
              <div className="text-xs font-semibold leading-tight">
                {userName}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {userEmail}
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isPending}
            title={t('login')}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
