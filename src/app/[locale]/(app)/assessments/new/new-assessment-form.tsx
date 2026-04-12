'use client';

import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState } from 'react';

import {
  createAssessmentAction,
  type CreateAssessmentResult,
} from '@/app/[locale]/(app)/assessments/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function NewAssessmentForm() {
  const t = useTranslations('assessments.form');
  const locale = useLocale();

  const [state, formAction, isPending] = useActionState<
    CreateAssessmentResult | null,
    FormData
  >(createAssessmentAction, null);

  const fieldError = (field: string) =>
    state && !state.ok ? state.errors[field] : undefined;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      {state && !state.ok && state.message && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">{t('titleLabel')}</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder={t('titlePlaceholder')}
          aria-invalid={!!fieldError('title')}
        />
        {fieldError('title') && (
          <p className="text-xs text-destructive">{fieldError('title')}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t('descriptionLabel')}</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder={t('descriptionPlaceholder')}
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type">{t('typeLabel')}</Label>
          <select
            id="type"
            name="type"
            required
            defaultValue="cognitive"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            <option value="cognitive">Cognitive</option>
            <option value="personality">Personality</option>
            <option value="situational">Situational Judgment</option>
            <option value="behavioral">Behavioral</option>
            <option value="language">Language</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="language">{t('languageLabel')}</Label>
          <select
            id="language"
            name="language"
            required
            defaultValue="en"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="both">Both (EN + AR)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border p-3">
        <input
          type="checkbox"
          id="isGraded"
          name="isGraded"
          defaultChecked
          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring/20"
        />
        <Label htmlFor="isGraded" className="cursor-pointer">
          {t('isGradedLabel')}
        </Label>
      </div>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('submit')}
      </Button>
    </form>
  );
}
