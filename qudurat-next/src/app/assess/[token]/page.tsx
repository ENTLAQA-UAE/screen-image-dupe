import { notFound } from 'next/navigation';

/**
 * Public assessment taker.
 *
 * Intentionally NOT inside the [locale] route group — participants access
 * this via a token link and language is inferred from the assessment data,
 * not the URL.
 *
 * TODO (Week 4): Migrate the 83KB TakeAssessment.tsx from the Vite app,
 * splitting into sub-components and lazy-loading heavy parts.
 */
export default async function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 8) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <h1 className="font-display text-2xl font-bold">
          Assessment Taker (Placeholder)
        </h1>
        <p className="mt-4 text-muted-foreground">
          Token: <code className="font-mono text-sm">{token}</code>
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          This page will be migrated from the Vite app in Week 4 of Phase 1.
        </p>
      </div>
    </main>
  );
}
