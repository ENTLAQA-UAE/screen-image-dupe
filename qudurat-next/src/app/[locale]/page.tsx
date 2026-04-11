import { ArrowRight, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/lib/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        ar: '/ar',
      },
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing.hero');

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-primary-50/30 px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
          <Sparkles className="h-4 w-4" />
          {t('tagline')}
        </div>

        <h1 className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          {t('title')}{' '}
          <span className="bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent">
            {t('titleHighlight')}
          </span>
        </h1>

        <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
          {t('subtitle')}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary/40"
          >
            {t('ctaPrimary')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-12 items-center rounded-lg border border-border bg-background px-6 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            {t('ctaSecondary')}
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {t('noCreditCard')}
        </p>
      </div>
    </main>
  );
}
