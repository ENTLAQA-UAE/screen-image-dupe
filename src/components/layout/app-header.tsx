'use client';

import { Globe, LogOut, Moon, Search, Sun, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useTransition } from 'react';

import { logoutAction } from '@/app/[locale]/(auth)/actions';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/layout/notification-bell';
import { Link, useRouter } from '@/lib/i18n/routing';

interface AppHeaderProps {
  pageTitle?: string;
  userName: string;
  userEmail: string;
  organizationName: string | null;
}

/**
 * Top header bar — sits inside the main content area (to the right of sidebar).
 * Contains: page title, ⌘K search, theme toggle, language switch, notifications, user.
 */
export function AppHeader({
  pageTitle,
  userName,
  userEmail,
  organizationName,
}: AppHeaderProps) {
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      {/* Left: page title */}
      <div className="flex items-center gap-4">
        {pageTitle && (
          <h1 className="font-display text-lg font-bold tracking-tight">
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Search (visual only — ⌘K triggers command palette in future) */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-2 text-muted-foreground sm:flex"
        >
          <Search className="h-4 w-4" />
          <span className="text-xs">Search...</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
          title="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Language toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/', { locale: otherLocale })}
          className="h-9 w-9"
          title={locale === 'ar' ? 'English' : 'العربية'}
        >
          <Globe className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* User avatar */}
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-start lg:block">
            <div className="text-xs font-semibold leading-tight">
              {userName}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {organizationName ?? userEmail}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
