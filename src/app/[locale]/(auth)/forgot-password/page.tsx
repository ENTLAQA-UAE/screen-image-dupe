import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ForgotPasswordForm } from '@/app/[locale]/(auth)/forgot-password/forgot-password-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
