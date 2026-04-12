import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { RegisterForm } from '@/app/[locale]/(auth)/register/register-form';
import { Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.register' });
  return {
    title: t('title'),
    alternates: {
      canonical: `/${locale}/register`,
      languages: { en: '/en/register', ar: '/ar/register' },
    },
  };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations('auth.register');

  return (
    <>
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          {t('loginLink')}
        </Link>
      </p>
    </>
  );
}
