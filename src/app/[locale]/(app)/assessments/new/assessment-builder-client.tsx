'use client';

import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Heart,
  Languages,
  Loader2,
  MessageSquare,


  Save,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// ==============================================================================
// Types & constants (matching original Vite builder)
// ==============================================================================

const ASSESSMENT_TYPES = {
  graded: [
    { value: 'cognitive', label: 'Cognitive Assessment', icon: Brain, description: 'IQ-style tests measuring reasoning, problem-solving, and analytical skills' },
    { value: 'language', label: 'Language Assessment', icon: Languages, description: 'English/Arabic proficiency testing grammar, vocabulary, and comprehension' },
    { value: 'situational', label: 'Situational Judgment (SJT)', icon: MessageSquare, description: 'Workplace scenarios measuring decision-making and competencies' },
    { value: 'generic_quiz', label: 'Generic Quiz', icon: FileText, description: 'Custom knowledge-based quiz with correct answers' },
  ],
  profile: [
    { value: 'personality', label: 'Personality Profile', icon: Heart, description: 'Big Five-based personality assessment for behavioral insights' },
    { value: 'behavioral', label: 'Behavioral Assessment (FBA)', icon: User, description: 'Functional behavioral analysis for workplace patterns' },
    { value: 'generic_profile', label: 'Generic Profile', icon: ClipboardCheck, description: 'Custom profile assessment with trait-based scoring' },
  ],
};

interface GeneratedQuestion {
  text: string;
  type: string;
  options: Array<{ text: string; value?: number; score?: number }>;
  correctAnswer?: number;
  scoringLogic?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ==============================================================================
// Main component — 5-step wizard
// ==============================================================================

interface Props {
  organizationId: string;
  userId: string;
  locale: string;
}

export function AssessmentBuilderClient({ organizationId, userId, locale }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 1: Category
  const [category, setCategory] = useState<'graded_quiz' | 'profile'>('graded_quiz');

  // Step 2: Type
  const [assessmentType, setAssessmentType] = useState('');

  // Step 3+4: Configuration
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'en' as 'en' | 'ar',
    questionCount: 20,
    difficulty: 'mixed' as 'easy' | 'medium' | 'hard' | 'mixed',
    showResultsToEmployee: true,
    aiFeedbackEnabled: true,
    timeLimitEnabled: false,
    timeLimit: 30,
  });

  // Step 5: Generated Questions
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  // Question editing deferred to future iteration

  // Step labels
  const steps = [
    'Category',
    'Type',
    'Configure',
    'Generate',
    'Review & Save',
  ];

  // ==============================================================================
  // AI Generation
  // ==============================================================================

  const handleGenerate = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in the title and description');
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-questions', {
        body: {
          assessmentType,
          category,
          language: formData.language,
          description: formData.description,
          questionCount: formData.questionCount,
          difficulty: formData.difficulty,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { questions } = response.data as { questions: GeneratedQuestion[] };
      if (!questions?.length) throw new Error('No questions generated');

      setGeneratedQuestions(questions);
      setStep(5);
      toast.success(`Generated ${questions.length} questions`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate questions';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  // ==============================================================================
  // Save assessment + questions
  // ==============================================================================

  const handleSave = async () => {
    setSaving(true);
    try {
      // Create assessment
      const { data: assessment, error: aErr } = await supabase
        .from('assessments')
        .insert({
          organization_id: organizationId,
          title: formData.title,
          description: formData.description,
          type: assessmentType,
          language: formData.language,
          is_graded: category === 'graded_quiz',
          status: 'draft',
          created_by: userId,
          config: {
            showResultsToEmployee: formData.showResultsToEmployee,
            aiFeedbackEnabled: formData.aiFeedbackEnabled,
            timeLimit: formData.timeLimitEnabled ? formData.timeLimit : null,
          },
        })
        .select()
        .single();

      if (aErr) throw aErr;

      // Create questions
      const questionsToInsert = generatedQuestions.map((q, index) => ({
        assessment_id: (assessment as { id: string }).id,
        organization_id: organizationId,
        type: q.type,
        text: q.text,
        options: q.options,
        correct_answer:
          q.correctAnswer !== undefined
            ? { index: q.correctAnswer }
            : q.scoringLogic ?? null,
        subdomain: q.metadata?.subdomain ?? q.metadata?.trait ?? null,
        order_index: index,
      }));

      const { error: qErr } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (qErr) throw qErr;

      toast.success('Assessment created successfully!');
      router.push(`/${locale}/assessments`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== index));
    toast.success('Question removed');
  };

  // ==============================================================================
  // Render
  // ==============================================================================

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Create Assessment
          </h1>
          <p className="text-sm text-muted-foreground">
            Step {step} of {steps.length}: {steps[step - 1]}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8 flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              i < step ? 'bg-primary' : 'bg-muted',
            )}
          />
        ))}
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="grid gap-6 md:grid-cols-2">
          <CategoryCard
            title="Graded Quiz"
            description="Questions with correct answers — cognitive tests, knowledge quizzes, SJT"
            icon={CheckCircle2}
            selected={category === 'graded_quiz'}
            onClick={() => {
              setCategory('graded_quiz');
              setAssessmentType('');
              setStep(2);
            }}
          />
          <CategoryCard
            title="Profile Assessment"
            description="No correct answers — personality, behavioral, trait-based assessments"
            icon={Heart}
            selected={category === 'profile'}
            onClick={() => {
              setCategory('profile');
              setAssessmentType('');
              setStep(2);
            }}
          />
        </div>
      )}

      {/* Step 2: Type */}
      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          {(category === 'graded_quiz'
            ? ASSESSMENT_TYPES.graded
            : ASSESSMENT_TYPES.profile
          ).map((type) => (
            <Card
              key={type.value}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                assessmentType === type.value
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'hover:border-primary/50',
              )}
              onClick={() => {
                setAssessmentType(type.value);
                setStep(3);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="icon-container bg-primary/10 text-primary">
                    <type.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{type.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 3: Configuration */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Configuration</CardTitle>
            <CardDescription>
              Set up your assessment details before generating questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Assessment title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g., Software Engineer Cognitive Test"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      language: e.target.value as 'en' | 'ar',
                    }))
                  }
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description * (used by AI to generate relevant questions)
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
                placeholder="Describe what this assessment should measure, the target audience, and any specific topics to cover..."
                className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="questionCount">Number of questions</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min={5}
                  max={100}
                  value={formData.questionCount}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      questionCount: parseInt(e.target.value) || 20,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      difficulty: e.target.value as typeof formData.difficulty,
                    }))
                  }
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timeLimit">Time limit (minutes)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.timeLimitEnabled}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        timeLimitEnabled: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  <Input
                    id="timeLimit"
                    type="number"
                    min={5}
                    max={240}
                    value={formData.timeLimit}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        timeLimit: parseInt(e.target.value) || 30,
                      }))
                    }
                    disabled={!formData.timeLimitEnabled}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.showResultsToEmployee}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      showResultsToEmployee: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">
                  Show results to participants after completion
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.aiFeedbackEnabled}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      aiFeedbackEnabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">
                  Enable AI-generated feedback and narratives
                </span>
              </label>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(4)} size="lg">
                Continue to Generation
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Generate */}
      {step === 4 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold">
              Ready to generate
            </h2>
            <p className="mt-2 text-muted-foreground">
              AI will generate{' '}
              <strong>{formData.questionCount} questions</strong> for your{' '}
              <strong>{assessmentType}</strong> assessment in{' '}
              <strong>{formData.language === 'ar' ? 'Arabic' : 'English'}</strong>
            </p>
            <div className="mt-4 rounded-lg bg-muted/50 p-4 text-start text-sm">
              <p className="font-medium">{formData.title}</p>
              <p className="mt-1 text-muted-foreground line-clamp-3">
                {formData.description}
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              size="lg"
              className="mt-6"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating questions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review & Save */}
      {step === 5 && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">
                {generatedQuestions.length} Questions Generated
              </h2>
              <p className="text-sm text-muted-foreground">
                Review, edit, or delete questions before saving
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(4)}>
                <Sparkles className="h-4 w-4" />
                Regenerate
              </Button>
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Assessment
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {generatedQuestions.map((q, i) => (
              <Card key={i} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {q.type}
                        </span>
                        {typeof q.metadata?.subdomain === 'string' && (
                          <span className="text-[10px] text-muted-foreground">
                            {q.metadata.subdomain}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium">{q.text}</p>
                      {q.options.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {q.options.map((opt, oi) => (
                            <li
                              key={oi}
                              className={cn(
                                'flex items-center gap-2 text-sm',
                                q.correctAnswer === oi &&
                                  'font-medium text-emerald-600',
                              )}
                            >
                              <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px]">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt.text}
                              {q.correctAnswer === oi && (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(i)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {generatedQuestions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                No questions yet. Go back and generate.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// Sub-components
// ==============================================================================

function CategoryCard({
  title,
  description,
  icon: Icon,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'hover:border-primary/50',
      )}
      onClick={onClick}
    >
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
