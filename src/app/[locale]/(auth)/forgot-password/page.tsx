import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ForgotPasswordForm } from '@/app/[locale]/(auth)/forgot-password/forgot-password-form';
import { Link } from '@/lib/i18n/routing';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Forgot your password?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ForgotPasswordForm />
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          Back to login
        </Link>
      </div>
    </>
  );
}
