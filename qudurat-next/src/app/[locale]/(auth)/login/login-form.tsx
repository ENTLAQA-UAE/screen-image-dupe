'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useActionState, useState } from 'react';

import { loginAction, type ActionResult } from '@/app/[locale]/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/lib/i18n/routing';

export function LoginForm() {
  const t = useTranslations('auth.login');
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(loginAction, null);

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
          aria-describedby={fieldError('email') ? 'email-error' : undefined}
        />
        {fieldError('email') && (
          <p id="email-error" className="text-xs text-destructive">
            {fieldError('email')}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('passwordLabel')}</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:text-primary-600"
          >
            {t('forgotPassword')}
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            aria-invalid={!!fieldError('password')}
            aria-describedby={
              fieldError('password') ? 'password-error' : undefined
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {fieldError('password') && (
          <p id="password-error" className="text-xs text-destructive">
            {fieldError('password')}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('submit')}
      </Button>
    </form>
  );
}
