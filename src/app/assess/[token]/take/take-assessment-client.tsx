'use client';

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ==============================================================================
// Types (matching the existing Vite app shape)
// ==============================================================================

interface Question {
  id: string;
  type: string;
  text: string;
  options: Array<{ text: string; value?: number }>;
}

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
  questions: Question[];
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    language: string;
  } | null;
  participant: { id: string; full_name: string } | null;
}

interface Props {
  token: string;
  participantId: string;
  bundle: AssessmentBundle;
}

// ==============================================================================
// Localized copy
// ==============================================================================

const COPY = {
  en: {
    question: 'Question',
    of: 'of',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit assessment',
    confirmSubmit: 'Submit and finish?',
    confirmSubmitDesc: 'Once submitted you cannot change your answers.',
    cancel: 'Cancel',
    submitting: 'Submitting...',
    completed: 'Assessment completed',
    completedDesc: 'Thank you! Your responses have been recorded.',
    timeRemaining: 'Time remaining',
    timeExpired: 'Time expired — submitting now',
    answerRequired: 'Please answer before continuing',
    errorSubmit: 'Failed to submit. Please try again.',
    selectOne: 'Select one option',
    typeAnswer: 'Type your answer here...',
  },
  ar: {
    question: 'السؤال',
    of: 'من',
    next: 'التالي',
    previous: 'السابق',
    submit: 'تسليم التقييم',
    confirmSubmit: 'هل تريد التسليم والانتهاء؟',
    confirmSubmitDesc: 'بعد التسليم لا يمكنك تغيير إجاباتك.',
    cancel: 'إلغاء',
    submitting: 'جارٍ التسليم...',
    completed: 'تم إكمال التقييم',
    completedDesc: 'شكراً لك! تم تسجيل إجاباتك.',
    timeRemaining: 'الوقت المتبقي',
    timeExpired: 'انتهى الوقت — جارٍ التسليم الآن',
    answerRequired: 'يرجى الإجابة قبل المتابعة',
    errorSubmit: 'فشل التسليم. يرجى المحاولة مرة أخرى.',
    selectOne: 'اختر إجابة واحدة',
    typeAnswer: 'اكتب إجابتك هنا...',
  },
};

// ==============================================================================
// Main component
// ==============================================================================

export function TakeAssessmentClient({ token, participantId, bundle }: Props) {
  const isArabic = bundle.assessment.language === 'ar';
  const t = COPY[isArabic ? 'ar' : 'en'];
  const dir = isArabic ? 'rtl' : 'ltr';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Timer (optional)
  const timeLimit = bundle.assessment.config.timeLimit;
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null,
  );
  const timerRef = useRef<number | null>(null);
  const autoSubmitRef = useRef(false);

  const questions = bundle.questions;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const currentAnswer =
    currentQuestion !== undefined ? answers[currentQuestion.id] : undefined;

  const primaryColor = bundle.organization?.primaryColor ?? '#0D9488';

  // --- Timer ---
  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining <= 0 && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      toast.warning(t.timeExpired);
      void handleSubmit(true);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setTimeRemaining((r) => (r === null ? null : Math.max(0, r - 1)));
    }, 1000);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  // --- Session restore ---
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`qudurat.answers.${token}`);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          answers: Record<string, unknown>;
          currentIndex: number;
        };
        if (parsed.answers) setAnswers(parsed.answers);
        if (typeof parsed.currentIndex === 'number') {
          setCurrentIndex(parsed.currentIndex);
        }
      }
    } catch {
      // Ignore corrupt session data
    }
  }, [token]);

  // --- Session save ---
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `qudurat.answers.${token}`,
        JSON.stringify({ answers, currentIndex }),
      );
    } catch {
      // Quota exceeded or disabled
    }
  }, [answers, currentIndex, token]);

  // --- Answer handlers ---
  const setCurrentAnswer = useCallback(
    (value: unknown) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion],
  );

  const handleNext = () => {
    if (currentAnswer === undefined || currentAnswer === '') {
      toast.error(t.answerRequired);
      return;
    }
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // --- Submission ---
  const handleSubmit = async (force: boolean = false) => {
    if (!force && currentAnswer === undefined) {
      toast.error(t.answerRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) throw new Error('Config missing');

      const answersArray = questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] ?? null,
      }));

      const response = await fetch(
        `${supabaseUrl}/functions/v1/submit-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
          },
          body: JSON.stringify({
            participantId,
            assessmentId: bundle.assessment.id,
            answers: answersArray,
            submissionType: force ? 'time_expired' : 'normal',
          }),
        },
      );

      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(err.error ?? t.errorSubmit);
      }

      sessionStorage.removeItem(`qudurat.answers.${token}`);
      sessionStorage.removeItem('qudurat.participant');
      setIsCompleted(true);

      // Celebration confetti
      try {
        const confetti = (await import('canvas-confetti')).default;
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval = window.setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      } catch {
        // Confetti failed silently — not critical
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.errorSubmit;
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // --- Completion screen ---
  if (isCompleted) {
    return (
      <div
        dir={dir}
        className={cn(
          'flex min-h-screen items-center justify-center bg-background p-6',
          isArabic && 'font-arabic',
        )}
      >
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold">{t.completed}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {t.completedDesc}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Confirm submit modal ---
  if (showConfirm) {
    return (
      <div
        dir={dir}
        className={cn(
          'flex min-h-screen items-center justify-center bg-background/80 p-6 backdrop-blur',
          isArabic && 'font-arabic',
        )}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle>{t.confirmSubmit}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.confirmSubmitDesc}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                {t.cancel}
              </Button>
              <Button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? t.submitting : t.submit}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>Loading…</div>;
  }

  // --- Main question UI ---
  return (
    <div
      dir={dir}
      className={cn(
        'flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-primary-50/20',
        isArabic && 'font-arabic',
      )}
    >
      {/* Top bar: progress + timer */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-card/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {bundle.organization?.logoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={bundle.organization.logoUrl}
                alt={bundle.organization.name}
                className="h-8 w-auto"
              />
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {bundle.assessment.title}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
                  timeRemaining < 60
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : timeRemaining < 300
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-border bg-background text-foreground',
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeRemaining)}
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              {t.question} {currentIndex + 1} {t.of} {totalQuestions}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: primaryColor,
            }}
          />
        </div>
      </header>

      {/* Question content */}
      <main className="flex-1 px-6 py-12">
        <div className="container mx-auto max-w-3xl">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.question} {currentIndex + 1}
              </div>
              <CardTitle className="text-2xl leading-snug">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionInput
                question={currentQuestion}
                value={currentAnswer}
                onChange={setCurrentAnswer}
                placeholder={t.typeAnswer}
                selectOneLabel={t.selectOne}
              />

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  {t.previous}
                </Button>

                {isLastQuestion ? (
                  <Button
                    onClick={() => setShowConfirm(true)}
                    disabled={currentAnswer === undefined}
                    size="lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t.submit}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={currentAnswer === undefined}
                    style={{ backgroundColor: primaryColor }}
                  >
                    {t.next}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ==============================================================================
// Question input renderer
// ==============================================================================

function QuestionInput({
  question,
  value,
  onChange,
  placeholder,
  selectOneLabel,
}: {
  question: Question;
  value: unknown;
  onChange: (v: unknown) => void;
  placeholder: string;
  selectOneLabel: string;
}) {
  // Multiple choice / single select
  if (
    (question.type === 'multiple_choice' ||
      question.type === 'mcq' ||
      question.type === 'single_select' ||
      question.type === 'likert') &&
    question.options.length > 0
  ) {
    return (
      <div>
        <div className="mb-3 text-xs text-muted-foreground">
          {selectOneLabel}
        </div>
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const selected = value === i || value === opt.text;
            return (
              <label
                key={i}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all',
                  selected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30',
                )}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={selected}
                  onChange={() => onChange(i)}
                  className="h-4 w-4 text-primary"
                />
                <span className="flex-1 text-sm">{opt.text}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  // Text / open-ended
  if (question.type === 'text' || question.type === 'open') {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`q-${question.id}`} className="sr-only">
          Answer
        </Label>
        <textarea
          id={`q-${question.id}`}
          rows={5}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
        />
      </div>
    );
  }

  // Fallback: render as single-select if options exist, otherwise text
  if (question.options.length > 0) {
    return (
      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <label
            key={i}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all',
              value === i ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              checked={value === i}
              onChange={() => onChange(i)}
            />
            <span className="text-sm">{opt.text}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <textarea
      rows={4}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
    />
  );
}
