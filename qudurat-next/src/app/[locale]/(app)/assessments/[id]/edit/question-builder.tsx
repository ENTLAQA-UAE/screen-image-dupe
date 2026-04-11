'use client';

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Plus,
  Rocket,
  Trash2,
  X,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  createQuestionAction,
  deleteQuestionAction,
  publishAssessmentAction,
  reorderQuestionsAction,
} from '@/app/[locale]/(app)/assessments/[id]/edit/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface QuestionRow {
  id: string;
  text: string;
  type: string;
  options: Array<{ text: string; value?: number; isCorrect?: boolean }>;
  orderIndex: number;
}

interface Props {
  assessmentId: string;
  assessmentType: string;
  assessmentStatus: string;
  initialQuestions: QuestionRow[];
}

export function QuestionBuilder({
  assessmentId,
  assessmentType,
  assessmentStatus,
  initialQuestions,
}: Props) {
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [status, setStatus] = useState(assessmentStatus);

  // Default question type by assessment type
  const defaultType =
    assessmentType === 'personality'
      ? 'likert'
      : assessmentType === 'language'
        ? 'text'
        : 'multiple_choice';

  const [draft, setDraft] = useState<{
    text: string;
    type: string;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>({
    text: '',
    type: defaultType,
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  const handleAdd = () => {
    if (!draft.text.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (
      (draft.type === 'multiple_choice' || draft.type === 'single_select') &&
      draft.options.filter((o) => o.text.trim()).length < 2
    ) {
      toast.error('At least 2 options are required');
      return;
    }

    startTransition(async () => {
      const result = await createQuestionAction(assessmentId, {
        text: draft.text,
        type: draft.type,
        options: draft.options.filter((o) => o.text.trim()),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      if (result.id) {
        setQuestions((qs) => [
          ...qs,
          {
            id: result.id!,
            text: draft.text,
            type: draft.type,
            options: draft.options.filter((o) => o.text.trim()),
            orderIndex: qs.length + 1,
          },
        ]);
      }
      setDraft({
        text: '',
        type: defaultType,
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      });
      setIsAdding(false);
      toast.success('Question added');
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this question?')) return;
    startTransition(async () => {
      const result = await deleteQuestionAction(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setQuestions((qs) => qs.filter((q) => q.id !== id));
      toast.success('Question deleted');
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newQuestions.length) return;

    const a = newQuestions[index];
    const b = newQuestions[target];
    if (!a || !b) return;
    newQuestions[index] = b;
    newQuestions[target] = a;
    setQuestions(newQuestions);

    startTransition(async () => {
      await reorderQuestionsAction(
        assessmentId,
        newQuestions.map((q) => q.id),
      );
    });
  };

  const handlePublish = () => {
    if (questions.length === 0) {
      toast.error('Add at least one question before publishing');
      return;
    }
    startTransition(async () => {
      const result = await publishAssessmentAction(assessmentId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setStatus('active');
      toast.success('Assessment published');
    });
  };

  return (
    <div className="space-y-4">
      {/* Questions list */}
      {questions.length === 0 && !isAdding && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No questions yet. Click &quot;Add question&quot; to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {questions.map((q, i) => (
        <Card key={q.id} className="group">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleMove(i, 'up')}
                  disabled={i === 0 || isPending}
                  className="h-6 w-6"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-semibold">
                  {i + 1}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleMove(i, 'down')}
                  disabled={i === questions.length - 1 || isPending}
                  className="h-6 w-6"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {q.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {q.options.length} options
                  </span>
                </div>
                <p className="mt-2 font-medium">{q.text}</p>
                {q.options.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {q.options.slice(0, 4).map((opt, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        {opt.text}
                        {opt.isCorrect && (
                          <Badge
                            variant="success"
                            className="text-[9px]"
                          >
                            correct
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(q.id)}
                disabled={isPending}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add question form */}
      {isAdding ? (
        <Card className="border-primary/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New question</CardTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsAdding(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="q-text">Question text</Label>
              <textarea
                id="q-text"
                value={draft.text}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, text: e.target.value }))
                }
                rows={3}
                className="mt-1.5 flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                placeholder="e.g. What is the primary purpose of..."
              />
            </div>

            <div>
              <Label htmlFor="q-type">Question type</Label>
              <select
                id="q-type"
                value={draft.type}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, type: e.target.value }))
                }
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm"
              >
                <option value="multiple_choice">Multiple choice</option>
                <option value="single_select">Single select</option>
                <option value="likert">Likert scale (1-5)</option>
                <option value="situational">Situational judgment</option>
                <option value="text">Open text</option>
              </select>
            </div>

            {(draft.type === 'multiple_choice' ||
              draft.type === 'single_select' ||
              draft.type === 'situational') && (
              <div>
                <Label>Options</Label>
                <div className="mt-1.5 space-y-2">
                  {draft.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={opt.isCorrect}
                        onChange={() =>
                          setDraft((d) => ({
                            ...d,
                            options: d.options.map((o, i) => ({
                              ...o,
                              isCorrect: i === idx,
                            })),
                          }))
                        }
                        className="h-4 w-4"
                        title="Mark as correct answer"
                      />
                      <Input
                        placeholder={`Option ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            options: d.options.map((o, i) =>
                              i === idx ? { ...o, text: e.target.value } : o,
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Select the radio button for the correct answer
                </p>
              </div>
            )}

            {draft.type === 'likert' && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Likert scale questions use a 1-5 agreement scale (Strongly
                Disagree → Strongly Agree). Options are auto-populated.
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Add question
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="w-full"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          Add question
        </Button>
      )}

      {/* Publish bar */}
      <div
        className={cn(
          'sticky bottom-4 mt-8 flex items-center justify-between rounded-xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur',
          status === 'active' && 'border-green-300 bg-green-50/90 dark:border-green-900/40 dark:bg-green-950/20',
        )}
      >
        <div>
          <div className="text-sm font-semibold">
            {status === 'active' ? '✓ Published' : 'Draft'}
          </div>
          <div className="text-xs text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </div>
        </div>
        {status !== 'active' && (
          <Button
            onClick={handlePublish}
            disabled={isPending || questions.length === 0}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}
