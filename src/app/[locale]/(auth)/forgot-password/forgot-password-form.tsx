'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState } from 'react';

import {
  forgotPasswordAction,
  type ActionResult,
} from '@/app/[locale]/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const t = useTranslations('auth.login');
  const locale = useLocale();

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(forgotPasswordAction, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-900/40 dark:bg-green-950/20">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        <p className="text-sm font-medium text-green-900 dark:text-green-100">
          Check your email for a password reset link.
        </p>
      </div>
    );
  }

  const fieldError = (field: string) =>
    state && !state.ok ? state.errors[field] : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      {state && !state.ok && state.message && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          aria-invalid={!!fieldError('email')}
        />
        {fieldError('email') && (
          <p className="text-xs text-destructive">{fieldError('email')}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Send reset link
      </Button>
    </form>
  );
}
