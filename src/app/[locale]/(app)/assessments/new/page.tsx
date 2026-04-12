import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { NewAssessmentForm } from '@/app/[locale]/(app)/assessments/new/new-assessment-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from '@/lib/i18n/routing';

export const metadata: Metadata = {
  title: 'New assessment',
};

export default async function NewAssessmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container max-w-2xl py-10">
      <Link
        href="/assessments"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        Back to assessments
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create assessment</CardTitle>
          <CardDescription>
            Start with basic details. You can add questions after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewAssessmentForm />
        </CardContent>
      </Card>
    </div>
  );
}
