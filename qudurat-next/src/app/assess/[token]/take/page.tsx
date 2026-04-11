import { Construction } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';

/**
 * Public assessment taker — question-by-question flow.
 *
 * PLACEHOLDER: The full taker UI is ~1900 lines in the Vite app
 * (src/pages/TakeAssessment.tsx) and will be migrated in Phase 1 Week 5
 * as a dedicated effort with:
 *   - Question-by-question rendering with Framer Motion transitions
 *   - Multiple question types (MCQ, Likert, text, ranking)
 *   - Timer and auto-submission
 *   - Swipe gestures on mobile
 *   - Offline queue integration
 *   - Distraction-free mode
 *   - Progress orb
 *   - Tab-switch detection
 *   - Auto-save to Supabase Realtime
 *   - Final submission via submit-assessment edge function
 *
 * For now, direct participants to the legacy Vite app for the actual test.
 */
export default async function TakeAssessmentFlowPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <Construction className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            Taker coming soon
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The Next.js version of the assessment taker is being built in
            Phase 1 Week 5. For now, continue in the legacy app:
          </p>
          <Link
            href={`/assess/${token}?legacy=true`}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-600"
          >
            Continue to assessment
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
