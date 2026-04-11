import { Check } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for Qudurat. Starter, Professional, and Enterprise plans.',
};

interface Plan {
  name: string;
  slug: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    slug: 'starter',
    price: '$349',
    period: '/month',
    description: 'For small teams starting with structured assessments.',
    features: [
      '500 assessments per month',
      '1 organization',
      '5 users',
      'All assessment types',
      '100 AI questions per month',
      'Basic branding (logo + primary color)',
      'Qudurat shared email provider',
      'Email support',
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Professional',
    slug: 'professional',
    price: '$999',
    period: '/month',
    description: 'For growing organizations with advanced needs.',
    features: [
      'Unlimited assessments',
      '3 organizations',
      '25 users',
      'All assessment types',
      '1,000 AI questions per month',
      'Full branding + white-label',
      'Custom domain',
      'Bring your own email provider',
      'Bring your own AI provider (BYOK)',
      'Advanced proctoring',
      'API access (read-only)',
      'Email + chat support',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    price: 'Custom',
    period: '',
    description: 'For enterprises with complex compliance needs.',
    features: [
      'Unlimited everything',
      '10+ organizations',
      'Unlimited users',
      'Video interview module',
      'Skills Passport',
      'Native integrations (SAP, Workday, etc.)',
      'Full API access',
      'SSO (SAML, OIDC)',
      'SOC 2 + DPA',
      'Data residency (KSA, UAE)',
      'Dedicated customer success manager',
      '99.95% SLA',
    ],
    cta: 'Contact sales',
  },
];

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
          Simple pricing,{' '}
          <span className="bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent">
            premium value
          </span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free for 14 days. No credit card required.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.slug}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm',
              plan.highlighted
                ? 'border-primary shadow-xl shadow-primary/10 md:scale-105'
                : 'border-border',
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.description}
              </p>
            </div>

            <div className="mb-6">
              <span className="font-display text-5xl font-bold">
                {plan.price}
              </span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              variant={plan.highlighted ? 'default' : 'outline'}
              size="lg"
              className="w-full"
            >
              <Link
                href={plan.slug === 'enterprise' ? '/contact' : '/register'}
              >
                {plan.cta}
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-2xl text-center">
        <h2 className="font-display text-2xl font-bold">
          Need something different?
        </h2>
        <p className="mt-2 text-muted-foreground">
          We offer custom plans for consultancies, government entities, and
          region-locked deployments.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>
    </div>
  );
}
