'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';

import {
  registerAction,
  type ActionResult,
} from '@/app/[locale]/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(registerAction, null);

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
        <Label htmlFor="fullName">{t('nameLabel')}</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          aria-invalid={!!fieldError('fullName')}
        />
        {fieldError('fullName') && (
          <p className="text-xs text-destructive">{fieldError('fullName')}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={!!fieldError('email')}
        />
        {fieldError('email') && (
          <p className="text-xs text-destructive">{fieldError('email')}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="organizationName">{t('orgNameLabel')}</Label>
        <Input
          id="organizationName"
          name="organizationName"
          type="text"
          required
          autoComplete="organization"
          aria-invalid={!!fieldError('organizationName')}
        />
        {fieldError('organizationName') && (
          <p className="text-xs text-destructive">
            {fieldError('organizationName')}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            aria-invalid={!!fieldError('password')}
            aria-describedby="password-hint"
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
        <p id="password-hint" className="text-xs text-muted-foreground">
          {t('passwordHint')}
        </p>
        {fieldError('password') && (
          <p className="text-xs text-destructive">{fieldError('password')}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">{t('passwordLabel')}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          aria-invalid={!!fieldError('confirmPassword')}
        />
        {fieldError('confirmPassword') && (
          <p className="text-xs text-destructive">
            {fieldError('confirmPassword')}
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
