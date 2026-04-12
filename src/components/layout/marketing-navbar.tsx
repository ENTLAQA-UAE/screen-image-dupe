'use client';

import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export function MarketingNavbar() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: '/features', label: t('features') },
    { href: '/pricing', label: t('pricing') },
    { href: '/about', label: t('about') },
    { href: '/blog', label: t('blog') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight"
        >
          قدرات <span className="text-muted-foreground">·</span>{' '}
          <span className="text-primary">Qudurat</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t('login')}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">{t('signup')}</Link>
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-t border-border/40 bg-background md:hidden',
          open ? 'max-h-96 py-4' : 'max-h-0',
          'transition-all duration-300',
        )}
      >
        <div className="container space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="ghost" className="flex-1">
              <Link href="/login">{t('login')}</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/register">{t('signup')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
