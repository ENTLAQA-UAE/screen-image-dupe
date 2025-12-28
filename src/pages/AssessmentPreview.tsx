import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileText,
  Eye,
  Timer,
  AlertTriangle,
  X,
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  text: string;
  options: Array<{ text: string; value?: number }> | null;
  correct_answer: any;
  order_index: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  language: string | null;
  is_graded: boolean | null;
  config: any;
}

type PreviewState = "loading" | "error" | "intro" | "questions" | "completed";

export default function AssessmentPreview() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState<PreviewState>("loading");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const isArabic = assessment?.language === "ar";

  const t = useMemo(() => ({
    previewMode: isArabic ? "وضع المعاينة" : "Preview Mode",
    previewDesc: isArabic 
      ? "هذه معاينة للتقييم. لن يتم حفظ إجاباتك."
      : "This is a preview of the assessment. Your answers will not be saved.",
    loading: isArabic ? "جاري التحميل..." : "Loading...",
    startPreview: isArabic ? "بدء المعاينة" : "Start Preview",
    questions: isArabic ? "أسئلة" : "questions",
    estimatedTime: isArabic ? "الوقت المقدر" : "Estimated time",
    minutes: isArabic ? "دقائق" : "minutes",
    timeLimit: isArabic ? "الحد الزمني" : "Time limit",
    questionOf: isArabic ? "السؤال {current} من {total}" : "Question {current} of {total}",
    previous: isArabic ? "السابق" : "Previous",
    next: isArabic ? "التالي" : "Next",
    finish: isArabic ? "إنهاء المعاينة" : "Finish Preview",
    previewComplete: isArabic ? "اكتملت المعاينة!" : "Preview Complete!",
    previewCompleteDesc: isArabic 
      ? "لقد راجعت جميع الأسئلة في هذا التقييم."
      : "You have reviewed all questions in this assessment.",
    backToAssessments: isArabic ? "العودة للتقييمات" : "Back to Assessments",
    restartPreview: isArabic ? "إعادة المعاينة" : "Restart Preview",
    showAnswers: isArabic ? "إظهار الإجابات الصحيحة" : "Show Correct Answers",
    hideAnswers: isArabic ? "إخفاء الإجابات الصحيحة" : "Hide Correct Answers",
    correctAnswer: isArabic ? "الإجابة الصحيحة" : "Correct Answer",
    noQuestions: isArabic ? "لا توجد أسئلة" : "No questions",
    noQuestionsDesc: isArabic 
      ? "لم يتم إضافة أسئلة لهذا التقييم بعد."
      : "No questions have been added to this assessment yet.",
    addQuestions: isArabic ? "إضافة أسئلة" : "Add Questions",
    exit: isArabic ? "خروج" : "Exit",
    graded: isArabic ? "مُقيّم" : "Graded",
    ungraded: isArabic ? "غير مُقيّم" : "Ungraded",
  }), [isArabic]);

  useEffect(() => {
    if (assessmentId && user) {
      loadAssessment();
    }
  }, [assessmentId, user]);

  const loadAssessment = async () => {
    try {
      // Fetch assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;

      // Parse options if they're stored as strings
      const parsedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        correct_answer: typeof q.correct_answer === "string" ? JSON.parse(q.correct_answer) : q.correct_answer,
      }));

      setQuestions(parsedQuestions);
      setState("intro");
    } catch (error: any) {
      console.error("Error loading assessment:", error);
      setErrorMessage(error.message || "Failed to load assessment");
      setState("error");
    }
  };

  const handleStartPreview = () => {
    if (questions.length === 0) {
      toast.error(t.noQuestions);
      return;
    }
    setCurrentIndex(0);
    setAnswers({});
    setState("questions");
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiAnswer = (questionId: string, optionValue: number, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, optionValue] };
      } else {
        return { ...prev, [questionId]: current.filter((v: number) => v !== optionValue) };
      }
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setState("completed");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const estimatedTime = Math.max(5, questions.length * 2);

  // Check if current answer is correct (for graded assessments)
  const isCurrentAnswerCorrect = useMemo(() => {
    if (!currentQuestion || !showCorrectAnswers || !assessment?.is_graded) return null;
    const answer = answers[currentQuestion.id];
    const correct = currentQuestion.correct_answer;
    if (correct === undefined || correct === null) return null;
    return JSON.stringify(answer) === JSON.stringify(correct);
  }, [currentQuestion, answers, showCorrectAnswers, assessment]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <Button onClick={() => navigate("/assessments")}>
              {t.backToAssessments}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isArabic ? "rtl" : "ltr"}`} dir={isArabic ? "rtl" : "ltr"}>
      {/* Preview Banner */}
      <div className="bg-warning/10 border-b border-warning/20 px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">{t.previewMode}</span>
            <span className="text-sm text-muted-foreground">- {t.previewDesc}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/assessments")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            {t.exit}
          </Button>
        </div>
      </div>

      {/* Intro State */}
      {state === "intro" && (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">{assessment?.title}</CardTitle>
                {assessment?.description && (
                  <p className="text-muted-foreground mt-2">{assessment.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <Badge variant="outline" className="capitalize">
                    {assessment?.type}
                  </Badge>
                  <Badge variant={assessment?.is_graded ? "default" : "secondary"}>
                    {assessment?.is_graded ? t.graded : t.ungraded}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{questions.length}</p>
                    <p className="text-sm text-muted-foreground">{t.questions}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">~{estimatedTime}</p>
                    <p className="text-sm text-muted-foreground">{t.minutes}</p>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-6">
                    <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">{t.noQuestionsDesc}</p>
                    <Button onClick={() => navigate(`/assessments/new?edit=${assessmentId}`)}>
                      {t.addQuestions}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    variant="hero"
                    onClick={handleStartPreview}
                  >
                    {t.startPreview}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Questions State */}
      {state === "questions" && currentQuestion && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {t.questionOf
                  .replace("{current}", String(currentIndex + 1))
                  .replace("{total}", String(questions.length))}
              </span>
              {assessment?.is_graded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
                  className="text-xs"
                >
                  {showCorrectAnswers ? t.hideAnswers : t.showAnswers}
                </Button>
              )}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>

                  {/* Show correct answer indicator */}
                  {showCorrectAnswers && assessment?.is_graded && currentQuestion.correct_answer !== null && (
                    <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {t.correctAnswer}: {
                          Array.isArray(currentQuestion.correct_answer) 
                            ? currentQuestion.correct_answer.map((idx: number) => 
                                currentQuestion.options?.[idx]?.text
                              ).join(", ")
                            : currentQuestion.options?.[currentQuestion.correct_answer]?.text
                        }
                      </p>
                    </div>
                  )}

                  {/* Options */}
                  {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                    <RadioGroup
                      value={answers[currentQuestion.id]?.toString() || ""}
                      onValueChange={(value) => handleAnswer(currentQuestion.id, parseInt(value))}
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((option, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                            answers[currentQuestion.id] === idx
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/50"
                          } ${
                            showCorrectAnswers && currentQuestion.correct_answer === idx
                              ? "ring-2 ring-success ring-offset-2"
                              : ""
                          }`}
                        >
                          <RadioGroupItem value={idx.toString()} />
                          <span>{option.text}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.type === "likert_scale" && currentQuestion.options && (
                    <RadioGroup
                      value={answers[currentQuestion.id]?.toString() || ""}
                      onValueChange={(value) => handleAnswer(currentQuestion.id, parseInt(value))}
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((option, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                            answers[currentQuestion.id] === idx
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          <RadioGroupItem value={idx.toString()} />
                          <span>{option.text}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.type === "multi_select" && currentQuestion.options && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, idx) => {
                        const isChecked = (answers[currentQuestion.id] || []).includes(idx);
                        const isCorrect = showCorrectAnswers && 
                          Array.isArray(currentQuestion.correct_answer) && 
                          currentQuestion.correct_answer.includes(idx);
                        
                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                              isChecked
                                ? "border-accent bg-accent/5"
                                : "border-border hover:border-accent/50"
                            } ${isCorrect ? "ring-2 ring-success ring-offset-2" : ""}`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => 
                                handleMultiAnswer(currentQuestion.id, idx, checked as boolean)
                              }
                            />
                            <span>{option.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.previous}
            </Button>

            <Button variant="hero" onClick={handleNext}>
              {currentIndex === questions.length - 1 ? t.finish : t.next}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Completed State */}
      {state === "completed" && (
        <div className="max-w-md mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t.previewComplete}</h2>
                <p className="text-muted-foreground mb-6">{t.previewCompleteDesc}</p>

                <div className="p-4 rounded-xl bg-muted/50 mb-6">
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(answers).length} / {questions.length} {t.questions} answered
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    variant="hero" 
                    className="w-full"
                    onClick={() => navigate("/assessments")}
                  >
                    {t.backToAssessments}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setCurrentIndex(0);
                      setAnswers({});
                      setState("intro");
                    }}
                  >
                    {t.restartPreview}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
