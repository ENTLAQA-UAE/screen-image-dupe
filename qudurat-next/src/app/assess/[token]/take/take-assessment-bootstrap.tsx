'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { TakeAssessmentClient } from '@/app/assess/[token]/take/take-assessment-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AssessmentBundle {
  status: string;
  assessmentGroup: { id: string; name: string; organizationId: string };
  assessment: {
    id: string;
    title: string;
    description: string;
    type: string;
    language: string;
    is_graded: boolean;
    config: {
      showResultsToEmployee: boolean;
      aiFeedbackEnabled: boolean;
      timeLimit?: number;
    };
  };
  questions: Array<{
    id: string;
    type: string;
    text: string;
    options: Array<{ text: string; value?: number }>;
  }>;
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    language: string;
  } | null;
  participant: { id: string; full_name: string } | null;
}

type State =
  | { status: 'loading' }
  | { status: 'no_participant' }
  | { status: 'error'; message: string }
  | { status: 'ready'; participantId: string; bundle: AssessmentBundle };

/**
 * Client bootstrap: reads participantId from sessionStorage, fetches the
 * assessment bundle via the `get-assessment` edge function, and then
 * hands off to the main TakeAssessmentClient.
 *
 * Keeps the page as a Server Component wrapper while allowing client-only
 * access to sessionStorage.
 */
export function TakeAssessmentBootstrap({ token }: { token: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const loadBundle = async () => {
      // Read participant session
      let participantId: string | null = null;
      try {
        const raw = sessionStorage.getItem('qudurat.participant');
        if (raw) {
          const parsed = JSON.parse(raw) as { participantId?: string };
          participantId = parsed.participantId ?? null;
        }
      } catch {
        // Ignore JSON errors
      }

      if (!participantId) {
        setState({ status: 'no_participant' });
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) {
        setState({
          status: 'error',
          message: 'Supabase configuration is missing',
        });
        return;
      }

      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/get-assessment?token=${encodeURIComponent(token)}&isGroupLink=true`,
          {
            method: 'GET',
            headers: { apikey: anonKey },
          },
        );

        if (!response.ok) {
          const err = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          setState({
            status: 'error',
            message: err.error ?? 'Failed to load assessment',
          });
          return;
        }

        const bundle = (await response.json()) as AssessmentBundle;
        setState({
          status: 'ready',
          participantId,
          bundle,
        });
      } catch (err) {
        setState({
          status: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Network error — please try again',
        });
      }
    };

    void loadBundle();
  }, [token]);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading assessment...
          </p>
        </div>
      </div>
    );
  }

  if (state.status === 'no_participant') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <h1 className="font-display text-xl font-bold">Registration required</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Please register first before starting the assessment.
            </p>
            <Button asChild className="mt-6">
              <a href={`/assess/${token}`}>Back to registration</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md shadow-xl border-destructive/30">
          <CardContent className="p-8 text-center">
            <h1 className="font-display text-xl font-bold text-destructive">
              Unable to load assessment
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {state.message}
            </p>
            <Button asChild variant="outline" className="mt-6">
              <a href={`/assess/${token}`}>Back</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TakeAssessmentClient
      token={token}
      participantId={state.participantId}
      bundle={state.bundle}
    />
  );
}
