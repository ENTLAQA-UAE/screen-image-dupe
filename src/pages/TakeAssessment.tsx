import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Download,
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  text: string;
  options: Array<{ text: string; value?: number }>;
}

interface AssessmentData {
  status: string;
  requiresRegistration: boolean;
  assessmentGroup: {
    id: string;
    name: string;
  };
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
    };
  };
  questions: Question[];
  organization: {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    language: string;
  } | null;
  participant: {
    id: string;
    full_name: string;
  } | null;
}

interface CompletedData {
  status: "completed";
  showResults: boolean;
  participant?: {
    id: string;
    full_name: string;
    score_summary: any;
    ai_report_text: string | null;
  };
  assessment?: {
    id: string;
    title: string;
    type: string;
    language: string;
    is_graded: boolean;
  };
  allowPdfDownload?: boolean;
}

type PageState = "loading" | "error" | "not_started" | "expired" | "closed" | "register" | "intro" | "questions" | "submitting" | "completed" | "results";

export default function TakeAssessment() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const isGroupLink = searchParams.get("group") === "true";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [completedData, setCompletedData] = useState<CompletedData | null>(null);
  
  // Registration form (for group links)
  const [regForm, setRegForm] = useState({
    full_name: "",
    email: "",
    department: "",
    job_title: "",
    employee_code: "",
  });
  
  // Question answering
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Submission results
  const [submissionResults, setSubmissionResults] = useState<any>(null);

  useEffect(() => {
    if (token) {
      loadAssessment();
    } else {
      setPageState("error");
      setErrorMessage("Invalid assessment link");
    }
  }, [token]);

  const loadAssessment = async () => {
    try {
      const response = await supabase.functions.invoke("get-assessment", {
        body: null,
        method: "GET",
      });

      // Use fetch directly for GET with query params
      const funcUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-assessment?token=${token}&isGroupLink=${isGroupLink}`;
      const res = await fetch(funcUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.status === "not_started") {
          setPageState("not_started");
          setStartDate(data.startDate);
          return;
        }
        if (data.status === "expired") {
          setPageState("expired");
          return;
        }
        if (data.status === "closed") {
          setPageState("closed");
          return;
        }
        throw new Error(data.error || "Failed to load assessment");
      }

      if (data.status === "completed") {
        setCompletedData(data);
        setPageState(data.showResults ? "results" : "completed");
        return;
      }

      setAssessmentData(data);
      
      if (data.participant) {
        setParticipantId(data.participant.id);
      }

      if (data.requiresRegistration) {
        setPageState("register");
      } else {
        setPageState("intro");
      }
    } catch (error: any) {
      console.error("Error loading assessment:", error);
      setPageState("error");
      setErrorMessage(error.message || "Failed to load assessment");
    }
  };

  const handleRegister = async () => {
    if (!regForm.full_name || !regForm.email) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      // Create participant via edge function or direct insert
      // For now, we'll create directly (RLS should allow this for group links)
      const { data, error } = await supabase
        .from("participants")
        .insert({
          group_id: assessmentData?.assessmentGroup.id,
          organization_id: assessmentData?.organization ? undefined : undefined, // Will be set by trigger
          full_name: regForm.full_name,
          email: regForm.email,
          department: regForm.department || null,
          job_title: regForm.job_title || null,
          employee_code: regForm.employee_code || null,
          status: "started",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setParticipantId(data.id);
      setPageState("intro");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error("Failed to register. Please try again.");
    }
  };

  const handleStartAssessment = () => {
    setPageState("questions");
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!assessmentData) return;
    
    const currentQuestion = assessmentData.questions[currentQuestionIndex];
    if (answers[currentQuestion.id] === undefined) {
      toast.error("Please select an answer");
      return;
    }

    if (currentQuestionIndex < assessmentData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessmentData || !participantId) return;

    setPageState("submitting");

    try {
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      const { data, error } = await supabase.functions.invoke("submit-assessment", {
        body: {
          participantId,
          assessmentId: assessmentData.assessment.id,
          answers: answersArray,
        },
      });

      if (error) throw error;

      setSubmissionResults(data);
      
      if (data.showResults && data.results) {
        setPageState("results");
      } else {
        setPageState("completed");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error("Failed to submit assessment. Please try again.");
      setPageState("questions");
    }
  };

  const organization = assessmentData?.organization;
  const primaryColor = organization?.primaryColor || "#0f172a";
  const isArabic = assessmentData?.assessment?.language === "ar";

  // Render different states
  const renderLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading assessment...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Unable to Load Assessment</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotStarted = () => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8">
          <Clock className="w-16 h-16 text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Assessment Not Yet Open</h1>
          <p className="text-muted-foreground">
            This assessment will be available starting{" "}
            {startDate ? new Date(startDate).toLocaleDateString() : "soon"}.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderExpired = () => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Assessment Ended</h1>
          <p className="text-muted-foreground">
            This assessment is no longer available. Please contact HR if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderRegister = () => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={isArabic ? "rtl" : "ltr"}>
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          {organization?.logoUrl && (
            <img src={organization.logoUrl} alt={organization.name} className="h-12 mx-auto mb-4 object-contain" />
          )}
          <CardTitle>{assessmentData?.assessment.title}</CardTitle>
          <CardDescription>Please provide your information to begin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={regForm.full_name}
              onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={regForm.email}
              onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
              placeholder="your.email@company.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={regForm.department}
                onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                placeholder="e.g., IT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={regForm.job_title}
                onChange={(e) => setRegForm({ ...regForm, job_title: e.target.value })}
                placeholder="e.g., Manager"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee_code">Employee Code</Label>
            <Input
              id="employee_code"
              value={regForm.employee_code}
              onChange={(e) => setRegForm({ ...regForm, employee_code: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <Button className="w-full" onClick={handleRegister}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntro = () => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={isArabic ? "rtl" : "ltr"}>
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          {organization?.logoUrl && (
            <img src={organization.logoUrl} alt={organization.name} className="h-12 mx-auto mb-4 object-contain" />
          )}
          <CardTitle className="text-2xl">{assessmentData?.assessment.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {assessmentData?.assessment.description || "Welcome to this assessment"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span>{assessmentData?.questions.length} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span>Estimated time: {Math.ceil((assessmentData?.questions.length || 20) * 0.5)} minutes</span>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <h3>Instructions</h3>
            <ul>
              <li>Read each question carefully before answering</li>
              <li>Select the option that best represents your response</li>
              <li>You can navigate back to previous questions</li>
              <li>Your progress is saved as you go</li>
            </ul>
          </div>

          {assessmentData?.participant && (
            <p className="text-sm text-muted-foreground text-center">
              Taking as: <strong>{assessmentData.participant.full_name}</strong>
            </p>
          )}

          <Button className="w-full" size="lg" onClick={handleStartAssessment}>
            Start Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderQuestions = () => {
    if (!assessmentData) return null;

    const question = assessmentData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / assessmentData.questions.length) * 100;
    const isLast = currentQuestionIndex === assessmentData.questions.length - 1;

    return (
      <div className="min-h-screen bg-background p-4" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {assessmentData.questions.length}
              </span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6 pb-6">
                  <h2 className="text-xl font-semibold mb-6">{question.text}</h2>

                  <RadioGroup
                    value={answers[question.id]?.toString() || ""}
                    onValueChange={(value) => {
                      const numValue = question.type === "likert" ? parseInt(value) : parseInt(value);
                      handleAnswer(question.id, numValue);
                    }}
                    className="space-y-3"
                  >
                    {question.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                        <RadioGroupItem
                          value={option.value?.toString() || index.toString()}
                          id={`option-${index}`}
                        />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer py-2">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              Previous
            </Button>
            <Button onClick={handleNext}>
              {isLast ? "Submit" : "Next"}
              <ArrowRight className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderSubmitting = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium">Submitting your responses...</p>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  );

  const renderCompleted = () => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground">
            Your assessment has been submitted successfully. Your responses have been recorded.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderResults = () => {
    const results = submissionResults?.results || completedData;
    const scoreSummary = results?.scoreSummary || completedData?.participant?.score_summary;
    const aiReport = results?.aiReport || completedData?.participant?.ai_report_text;
    const isGraded = assessmentData?.assessment?.is_graded ?? completedData?.assessment?.is_graded;

    return (
      <div className="min-h-screen bg-background p-4" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto py-8">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <CardTitle>Assessment Complete!</CardTitle>
              <CardDescription>Here are your results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isGraded && scoreSummary && (
                <div className="text-center p-6 bg-muted rounded-lg">
                  <div className="text-5xl font-bold mb-2" style={{ color: primaryColor }}>
                    {scoreSummary.percentage}%
                  </div>
                  <p className="text-muted-foreground">
                    {scoreSummary.correctCount} of {scoreSummary.totalPossible} correct
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                    Grade: {scoreSummary.grade}
                  </div>
                </div>
              )}

              {!isGraded && scoreSummary?.traits && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Your Profile</h3>
                  {Object.entries(scoreSummary.traits).map(([trait, score]: [string, any]) => (
                    <div key={trait} className="flex items-center justify-between">
                      <span className="capitalize">{trait}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(score / 5) * 100} className="w-32 h-2" />
                        <span className="text-sm font-medium w-8">{score.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {aiReport && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Personalized Feedback</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{aiReport}</p>
                  </div>
                </div>
              )}

              {(results?.allowPdfDownload || completedData?.allowPdfDownload) && (
                <div className="text-center pt-4">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  switch (pageState) {
    case "loading": return renderLoading();
    case "error": return renderError();
    case "not_started": return renderNotStarted();
    case "expired": return renderExpired();
    case "closed": return renderExpired();
    case "register": return renderRegister();
    case "intro": return renderIntro();
    case "questions": return renderQuestions();
    case "submitting": return renderSubmitting();
    case "completed": return renderCompleted();
    case "results": return renderResults();
    default: return renderLoading();
  }
}
