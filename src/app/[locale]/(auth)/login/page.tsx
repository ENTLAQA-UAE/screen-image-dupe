import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LoginForm } from '@/app/[locale]/(auth)/login/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.login' });
  return {
    title: t('title'),
    alternates: {
      canonical: `/${locale}/login`,
      languages: { en: '/en/login', ar: '/ar/login' },
    },
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // If already authenticated, redirect to dashboard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations('auth.login');

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link
            href="/register"
            className="font-semibold text-primary hover:text-primary-600"
          >
            {t('signupLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
