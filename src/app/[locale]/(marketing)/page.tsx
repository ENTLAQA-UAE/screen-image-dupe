import {
  ArrowRight,
  Brain,
  BarChart3,
  Check,
  Globe,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Button } from '@/components/ui/button';
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
      languages: { en: '/en', ar: '/ar' },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
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
  const t = await getTranslations();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Question Generation',
      description:
        'Generate assessment questions in English and Arabic with Claude, GPT-4, or your own LLM.',
    },
    {
      icon: Users,
      title: 'Multi-Tenant by Design',
      description:
        'Each organization gets its own subdomain, branding, and custom domain support.',
    },
    {
      icon: Globe,
      title: 'Bilingual & RTL Native',
      description:
        'First-class Arabic support with culturally-aware translations and RTL layouts.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'Row-level security, SOC 2 roadmap, GDPR + PDPL compliant, data residency options.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'AI-generated narrative reports, competency radars, and team composition insights.',
    },
    {
      icon: Zap,
      title: 'Cognitive, Personality, Behavioral',
      description:
        'Full spectrum of assessment types: IQ, Big Five, SJT, language, and custom quizzes.',
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 md:pt-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:border-primary-900 dark:bg-primary-950/40 dark:text-primary-300">
            <Sparkles className="h-4 w-4" />
            {t('landing.hero.tagline')}
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {t('landing.hero.title')}{' '}
            <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent bg-clip-text text-transparent">
              {t('landing.hero.titleHighlight')}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                {t('landing.hero.ctaPrimary')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/demo">{t('landing.hero.ctaSecondary')}</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            <Check className="me-1 inline h-4 w-4 text-primary" />
            {t('landing.hero.noCreditCard')}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/40 bg-card/30 py-12">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
          <Stat value="10,000+" label={t('landing.stats.assessments')} />
          <Stat value="50+" label={t('landing.stats.organizations')} />
          <Stat value="2" label={t('landing.stats.languages')} />
          <Stat value="12+" label={t('landing.stats.countries')} />
        </div>
      </section>

      {/* Features */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {t('landing.features.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-12 text-center shadow-2xl shadow-primary/30 md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl md:text-5xl">
              Ready to assess smarter?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join organizations across the MENA region using Qudurat.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link href="/register">
                  {t('landing.hero.ctaPrimary')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link href="/contact">Talk to sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-4xl font-bold text-foreground">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
