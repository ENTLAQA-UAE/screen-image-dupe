import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  Timer,
  Building2,
} from "lucide-react";
import { openParticipantPrintPreview } from "@/lib/printPreview";

// Bilingual translations
const translations = {
  en: {
    loading: "Loading assessment...",
    invalidLink: "Invalid assessment link",
    unableToLoad: "Unable to Load Assessment",
    notYetOpen: "Assessment Not Yet Open",
    notYetOpenDesc: "This assessment will be available starting",
    soon: "soon",
    assessmentEnded: "Assessment Ended",
    assessmentEndedDesc: "This assessment is no longer available. Please contact HR if you believe this is an error.",
    assessmentClosed: "Assessment Closed",
    assessmentClosedDesc: "This assessment has been closed by the administrator.",
    provideInfo: "Please provide your information to begin",
    fullName: "Full Name",
    email: "Email",
    department: "Department",
    jobTitle: "Job Title",
    employeeCode: "Employee Code",
    optional: "Optional",
    continue: "Continue",
    required: "Required",
    fillRequired: "Please fill in required fields",
    registrationFailed: "Failed to register. Please try again.",
    welcome: "Welcome to this assessment",
    questions: "questions",
    estimatedTime: "Estimated time",
    minutes: "minutes",
    timeLimit: "Time limit",
    instructions: "Instructions",
    instruction1: "Read each question carefully before answering",
    instruction2: "Select the option that best represents your response",
    instruction3: "You can navigate back to previous questions",
    instruction4: "Your progress is saved as you go",
    instruction5: "Important: If you close or leave this tab during the assessment, it will be automatically submitted and you will no longer have access to it",
    takingAs: "Taking as",
    startAssessment: "Start Assessment",
    questionOf: "Question {current} of {total}",
    previous: "Previous",
    next: "Next",
    submit: "Submit",
    selectAnswer: "Please select an answer",
    submitting: "Submitting your responses...",
    pleaseWait: "Please wait",
    thankYou: "Thank You!",
    submittedSuccess: "Your assessment has been submitted successfully. Your responses have been recorded.",
    assessmentComplete: "Assessment Complete!",
    yourResults: "Here are your results",
    correct: "correct",
    grade: "Grade",
    yourProfile: "Your Profile",
    personalizedFeedback: "Personalized Feedback",
    downloadPdf: "Download PDF Report",
    timeRemaining: "Time remaining",
    timeUp: "Time's up!",
    timeUpDesc: "Your assessment will be submitted automatically.",
    of: "of",
  },
  ar: {
    loading: "جاري تحميل التقييم...",
    invalidLink: "رابط التقييم غير صالح",
    unableToLoad: "تعذر تحميل التقييم",
    notYetOpen: "التقييم غير متاح بعد",
    notYetOpenDesc: "سيكون هذا التقييم متاحاً ابتداءً من",
    soon: "قريباً",
    assessmentEnded: "انتهى التقييم",
    assessmentEndedDesc: "هذا التقييم لم يعد متاحاً. يرجى التواصل مع الموارد البشرية إذا كنت تعتقد أن هذا خطأ.",
    assessmentClosed: "التقييم مغلق",
    assessmentClosedDesc: "تم إغلاق هذا التقييم من قبل المسؤول.",
    provideInfo: "يرجى تقديم معلوماتك للبدء",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    department: "القسم",
    jobTitle: "المسمى الوظيفي",
    employeeCode: "رقم الموظف",
    optional: "اختياري",
    continue: "متابعة",
    required: "مطلوب",
    fillRequired: "يرجى ملء الحقول المطلوبة",
    registrationFailed: "فشل التسجيل. يرجى المحاولة مرة أخرى.",
    welcome: "مرحباً بك في هذا التقييم",
    questions: "أسئلة",
    estimatedTime: "الوقت المقدر",
    minutes: "دقائق",
    timeLimit: "الحد الزمني",
    instructions: "التعليمات",
    instruction1: "اقرأ كل سؤال بعناية قبل الإجابة",
    instruction2: "اختر الخيار الذي يمثل إجابتك بشكل أفضل",
    instruction3: "يمكنك العودة إلى الأسئلة السابقة",
    instruction4: "يتم حفظ تقدمك تلقائياً",
    instruction5: "تنبيه هام: إذا أغلقت أو غادرت هذه الصفحة أثناء التقييم، سيتم إرساله تلقائياً ولن يكون بإمكانك الوصول إليه مرة أخرى",
    takingAs: "المشارك",
    startAssessment: "بدء التقييم",
    questionOf: "السؤال {current} من {total}",
    previous: "السابق",
    next: "التالي",
    submit: "إرسال",
    selectAnswer: "يرجى اختيار إجابة",
    submitting: "جاري إرسال إجاباتك...",
    pleaseWait: "يرجى الانتظار",
    thankYou: "شكراً لك!",
    submittedSuccess: "تم إرسال تقييمك بنجاح. تم تسجيل إجاباتك.",
    assessmentComplete: "اكتمل التقييم!",
    yourResults: "إليك نتائجك",
    correct: "صحيحة",
    grade: "الدرجة",
    yourProfile: "ملفك الشخصي",
    personalizedFeedback: "التقييم الشخصي",
    downloadPdf: "تحميل تقرير PDF",
    timeRemaining: "الوقت المتبقي",
    timeUp: "انتهى الوقت!",
    timeUpDesc: "سيتم إرسال تقييمك تلقائياً.",
    of: "من",
  },
};

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
    organizationId: string;
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
      timeLimit?: number; // in minutes
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
    email: string;
    employee_code?: string;
    department?: string;
    score_summary: any;
    ai_report_text: string | null;
    completed_at: string | null;
  };
  assessment?: {
    id: string;
    title: string;
    type: string;
    language: string;
    is_graded: boolean;
  };
  assessmentGroup?: {
    id: string;
    name: string;
  };
  organization?: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    language: string;
  } | null;
  allowPdfDownload?: boolean;
}

type PageState = "loading" | "error" | "not_started" | "expired" | "closed" | "register" | "intro" | "questions" | "submitting" | "completed" | "results";

export default function TakeAssessment() {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get("token");
  const token = pathToken || queryToken;
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

  // Timer
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [shownWarnings, setShownWarnings] = useState<Set<number>>(new Set());

  // State for error pages with branding
  const [errorOrganization, setErrorOrganization] = useState<{
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    language?: string;
  } | null>(null);
  const [errorAssessment, setErrorAssessment] = useState<{
    title: string;
    language: string;
  } | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Submission results
  const [submissionResults, setSubmissionResults] = useState<any>(null);

  // Language detection - also check error state data
  const isArabic = useMemo(() => {
    return assessmentData?.assessment?.language === "ar" || 
           assessmentData?.organization?.language === "ar" ||
           completedData?.assessment?.language === "ar" ||
           completedData?.organization?.language === "ar" ||
           errorOrganization?.language === "ar" ||
           errorAssessment?.language === "ar";
  }, [assessmentData, completedData, errorOrganization, errorAssessment]);

  const t = useMemo(() => translations[isArabic ? "ar" : "en"], [isArabic]);

  const organization = assessmentData?.organization;
  const primaryColor = organization?.primaryColor || "#0f172a";

  useEffect(() => {
    if (token) {
      loadAssessment();
    } else {
      setPageState("error");
      setErrorMessage(t.invalidLink);
    }
  }, [token]);

  // Timer effect with warnings
  useEffect(() => {
    if (!timerActive || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      toast.error(isArabic ? "انتهى الوقت! جاري الإرسال..." : "Time's up! Submitting...");
      handleSubmit();
      return;
    }

    // Show warnings at 5 min, 2 min, and 1 min
    const warningThresholds = [300, 120, 60];
    for (const threshold of warningThresholds) {
      if (timeRemaining === threshold && !shownWarnings.has(threshold)) {
        const minutes = Math.floor(threshold / 60);
        const message = isArabic 
          ? `تنبيه: متبقي ${minutes === 1 ? "دقيقة واحدة" : `${minutes} دقائق`}!` 
          : `Warning: ${minutes} minute${minutes > 1 ? "s" : ""} remaining!`;
        toast.warning(message, { duration: 5000 });
        setShownWarnings(prev => new Set([...prev, threshold]));
      }
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, shownWarnings, isArabic]);

  // Beforeunload warning when assessment is in progress
  useEffect(() => {
    if (pageState !== "questions") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = "Are you sure you want to leave? Your assessment will be submitted.";
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pageState]);


  const loadAssessment = async () => {
    try {
      const funcUrl = `https://ephwmhikhiiyrnikvrwp.supabase.co/functions/v1/get-assessment?token=${token}&isGroupLink=${isGroupLink}`;
      const res = await fetch(funcUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        // Store branding data for error pages
        if (data.organization) {
          setErrorOrganization(data.organization);
        }
        if (data.assessment) {
          setErrorAssessment(data.assessment);
        }
        
        if (data.status === "not_started") {
          setPageState("not_started");
          setStartDate(data.startDate);
          return;
        }
        if (data.status === "expired") {
          setPageState("expired");
          setEndDate(data.endDate);
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

      // Set timer if configured
      if (data.assessment?.config?.timeLimit) {
        setTimeRemaining(data.assessment.config.timeLimit * 60); // Convert to seconds
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
    if (!regForm.employee_code || !regForm.full_name || !regForm.email) {
      toast.error(t.fillRequired);
      return;
    }

    if (!token) {
      console.error("Missing group token");
      toast.error(t.registrationFailed);
      return;
    }

    try {
      // Use edge function for registration to bypass RLS issues
      const funcUrl = `https://ephwmhikhiiyrnikvrwp.supabase.co/functions/v1/register-participant`;
      const res = await fetch(funcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupToken: token,
          fullName: regForm.full_name.trim(),
          email: regForm.email.trim().toLowerCase(),
          employeeCode: regForm.employee_code.trim(),
          department: regForm.department?.trim() || null,
          jobTitle: regForm.job_title?.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error codes
        if (data.code === "DUPLICATE_CODE") {
          const errorMsg = isArabic 
            ? "رقم الموظف هذا قد أخذ هذا التقييم بالفعل" 
            : "This employee code has already taken this assessment";
          toast.error(errorMsg);
          return;
        }
        if (data.code === "DUPLICATE_EMAIL") {
          const errorMsg = isArabic 
            ? "هذا البريد الإلكتروني قد أخذ هذا التقييم بالفعل" 
            : "This email has already taken this assessment";
          toast.error(errorMsg);
          return;
        }
        if (data.code === "DUPLICATE") {
          const errorMsg = isArabic 
            ? "لقد قمت بأخذ هذا التقييم بالفعل" 
            : "You have already taken this assessment";
          toast.error(errorMsg);
          return;
        }
        throw new Error(data.error || "Registration failed");
      }

      setParticipantId(data.participantId);
      setPageState("intro");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(t.registrationFailed);
    }
  };

  const handleStartAssessment = () => {
    setPageState("questions");
    if (timeRemaining !== null) {
      setTimerActive(true);
    }
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiAnswer = (questionId: string, optionValue: number, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, optionValue] };
      } else {
        return { ...prev, [questionId]: current.filter((v: number) => v !== optionValue) };
      }
    });
  };

  const handleNext = () => {
    if (!assessmentData) return;
    
    const currentQuestion = assessmentData.questions[currentQuestionIndex];
    if (answers[currentQuestion.id] === undefined) {
      toast.error(t.selectAnswer);
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

  const handleSubmit = useCallback(async () => {
    if (!assessmentData || !participantId) return;

    setTimerActive(false);
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
  }, [assessmentData, participantId, answers]);

  // Auto-submit on visibility change (tab switch/hide)
  useEffect(() => {
    if (pageState !== "questions") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        toast.info(isArabic ? "تم إرسال التقييم تلقائياً بسبب مغادرة الصفحة" : "Assessment auto-submitted due to leaving the page");
        handleSubmit();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pageState, handleSubmit, isArabic]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Render components
  const renderLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center shadow-elegant">
        <CardContent className="pt-8 pb-8">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 font-display">{t.unableToLoad}</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotStarted = () => {
    const orgData = errorOrganization;
    const assessmentTitle = errorAssessment?.title;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={isArabic ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full text-center shadow-elegant overflow-hidden">
          {orgData && (
            <div 
              className="p-4 border-b"
              style={{ 
                background: orgData.primaryColor ? `${orgData.primaryColor}10` : undefined,
                borderColor: orgData.primaryColor ? `${orgData.primaryColor}30` : undefined
              }}
            >
              {orgData.logoUrl ? (
                <img src={orgData.logoUrl} alt={orgData.name} className="h-10 mx-auto object-contain" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="w-5 h-5" style={{ color: orgData.primaryColor }} />
                  <span className="font-semibold">{orgData.name}</span>
                </div>
              )}
            </div>
          )}
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-highlight/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-highlight" />
            </div>
            <h1 className="text-2xl font-bold mb-2 font-display">{t.notYetOpen}</h1>
            {assessmentTitle && (
              <p className="text-sm text-muted-foreground mb-3">{assessmentTitle}</p>
            )}
            <p className="text-muted-foreground">
              {t.notYetOpenDesc}{" "}
              <span className="font-semibold">
                {startDate ? new Date(startDate).toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : t.soon}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderExpired = () => {
    const orgData = errorOrganization;
    const assessmentTitle = errorAssessment?.title;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={isArabic ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full text-center shadow-elegant overflow-hidden">
          {orgData && (
            <div 
              className="p-4 border-b"
              style={{ 
                background: orgData.primaryColor ? `${orgData.primaryColor}10` : undefined,
                borderColor: orgData.primaryColor ? `${orgData.primaryColor}30` : undefined
              }}
            >
              {orgData.logoUrl ? (
                <img src={orgData.logoUrl} alt={orgData.name} className="h-10 mx-auto object-contain" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="w-5 h-5" style={{ color: orgData.primaryColor }} />
                  <span className="font-semibold">{orgData.name}</span>
                </div>
              )}
            </div>
          )}
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2 font-display">{t.assessmentEnded}</h1>
            {assessmentTitle && (
              <p className="text-sm text-muted-foreground mb-3">{assessmentTitle}</p>
            )}
            <p className="text-muted-foreground">{t.assessmentEndedDesc}</p>
            {endDate && (
              <p className="text-xs text-muted-foreground mt-3">
                {isArabic ? "انتهى في" : "Ended on"}{" "}
                {new Date(endDate).toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderClosed = () => {
    const orgData = errorOrganization;
    const assessmentTitle = errorAssessment?.title;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={isArabic ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full text-center shadow-elegant overflow-hidden">
          {orgData && (
            <div 
              className="p-4 border-b"
              style={{ 
                background: orgData.primaryColor ? `${orgData.primaryColor}10` : undefined,
                borderColor: orgData.primaryColor ? `${orgData.primaryColor}30` : undefined
              }}
            >
              {orgData.logoUrl ? (
                <img src={orgData.logoUrl} alt={orgData.name} className="h-10 mx-auto object-contain" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="w-5 h-5" style={{ color: orgData.primaryColor }} />
                  <span className="font-semibold">{orgData.name}</span>
                </div>
              )}
            </div>
          )}
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2 font-display">{t.assessmentClosed}</h1>
            {assessmentTitle && (
              <p className="text-sm text-muted-foreground mb-3">{assessmentTitle}</p>
            )}
            <p className="text-muted-foreground">{t.assessmentClosedDesc}</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRegister = () => (
    <div 
      className="min-h-screen flex items-center justify-center p-4 gradient-subtle" 
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Card className="max-w-lg w-full shadow-elegant">
        <CardHeader className="text-center pb-2">
          {organization?.logoUrl ? (
            <img src={organization.logoUrl} alt={organization.name} className="h-14 mx-auto mb-4 object-contain" />
          ) : organization?.name ? (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="w-6 h-6 text-primary" />
              <span className="font-semibold text-lg">{organization.name}</span>
            </div>
          ) : null}
          <CardTitle className="text-xl font-display">{assessmentData?.assessment.title}</CardTitle>
          <CardDescription>{t.provideInfo}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Code - First and Required */}
          <div className="space-y-2">
            <Label htmlFor="employee_code" className="flex items-center gap-1">
              {t.employeeCode} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="employee_code"
              value={regForm.employee_code}
              onChange={(e) => setRegForm({ ...regForm, employee_code: e.target.value })}
              placeholder={isArabic ? "أدخل رقم الموظف" : "Enter employee code"}
              className="transition-smooth"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-1">
              {t.fullName} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              value={regForm.full_name}
              onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
              placeholder={isArabic ? "أدخل اسمك الكامل" : "Enter your full name"}
              className="transition-smooth"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              {t.email} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={regForm.email}
              onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
              placeholder={isArabic ? "بريدك@الشركة.com" : "your.email@company.com"}
              className="transition-smooth"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">{t.department}</Label>
              <Input
                id="department"
                value={regForm.department}
                onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                placeholder={isArabic ? "مثال: تقنية المعلومات" : "e.g., IT"}
                className="transition-smooth"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">{t.jobTitle}</Label>
              <Input
                id="job_title"
                value={regForm.job_title}
                onChange={(e) => setRegForm({ ...regForm, job_title: e.target.value })}
                placeholder={isArabic ? "مثال: مدير" : "e.g., Manager"}
                className="transition-smooth"
              />
            </div>
          </div>
          <Button className="w-full mt-4 transition-smooth" size="lg" onClick={handleRegister}>
            {t.continue}
            <ArrowRight className={`w-4 h-4 ${isArabic ? "mr-2 rotate-180" : "ml-2"}`} />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntro = () => (
    <div 
      className="min-h-screen flex items-center justify-center p-4 gradient-subtle" 
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Card className="max-w-2xl w-full shadow-elegant">
        <CardHeader className="text-center pb-4">
          {organization?.logoUrl ? (
            <img src={organization.logoUrl} alt={organization.name} className="h-14 mx-auto mb-4 object-contain" />
          ) : organization?.name ? (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="w-6 h-6 text-primary" />
              <span className="font-semibold text-lg">{organization.name}</span>
            </div>
          ) : null}
          <CardTitle className="text-2xl font-display">{assessmentData?.assessment.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {assessmentData?.assessment.description || t.welcome}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assessment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.questions}</p>
                <p className="font-semibold">{assessmentData?.questions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {assessmentData?.assessment.config?.timeLimit ? t.timeLimit : t.estimatedTime}
                </p>
                <p className="font-semibold">
                  {assessmentData?.assessment.config?.timeLimit || 
                   Math.ceil((assessmentData?.questions.length || 20) * 0.5)} {t.minutes}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold font-display">{t.instructions}</h3>
            <ul className={`space-y-2 ${isArabic ? "pr-5" : "pl-5"}`}>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{t.instruction1}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{t.instruction2}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{t.instruction3}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{t.instruction4}</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <span className="text-warning font-medium">{t.instruction5}</span>
              </li>
            </ul>
          </div>

          {/* Timer warning */}
          {timeRemaining !== null && (
            <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-warning">
                  {isArabic ? "تقييم محدد بوقت" : "Timed Assessment"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isArabic 
                    ? `لديك ${Math.floor(timeRemaining / 60)} دقيقة لإكمال هذا التقييم. سيتم الإرسال تلقائياً عند انتهاء الوقت.`
                    : `You have ${Math.floor(timeRemaining / 60)} minutes to complete this assessment. It will auto-submit when time expires.`
                  }
                </p>
              </div>
            </div>
          )}

          {assessmentData?.participant && (
            <p className="text-sm text-muted-foreground text-center">
              {t.takingAs}: <strong>{assessmentData.participant.full_name}</strong>
            </p>
          )}

          <Button className="w-full transition-smooth" size="lg" onClick={handleStartAssessment}>
            {t.startAssessment}
            <ArrowRight className={`w-5 h-5 ${isArabic ? "mr-2 rotate-180" : "ml-2"}`} />
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
    const isMultiSelect = question.type === "mcq_multi";

    return (
      <div className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
        {/* Header with progress and timer */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-medium">
                {t.questionOf
                  .replace("{current}", String(currentQuestionIndex + 1))
                  .replace("{total}", String(assessmentData.questions.length))}
              </span>
              {timeRemaining !== null && (
                <motion.div 
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    timeRemaining < 60 ? "bg-destructive/10 text-destructive" : 
                    timeRemaining < 300 ? "bg-warning/10 text-warning" : 
                    "bg-primary/10 text-primary"
                  }`}
                  animate={timeRemaining < 60 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Timer className={`w-4 h-4 ${timeRemaining < 60 ? "animate-pulse" : ""}`} />
                  <span className="font-mono font-semibold text-sm">{formatTime(timeRemaining)}</span>
                  {timeRemaining < 300 && timeRemaining >= 60 && (
                    <span className="text-xs hidden sm:inline">{t.timeRemaining}</span>
                  )}
                  {timeRemaining < 60 && (
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  )}
                </motion.div>
              )}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question content */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isArabic ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-elegant">
                <CardContent className="pt-8 pb-8" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                  <h2 className={`text-xl font-semibold mb-8 font-display leading-relaxed ${isArabic ? 'text-right' : 'text-left'}`}>{question.text}</h2>

                  {isMultiSelect ? (
                    <div className="space-y-3">
                      {question.options.map((option, index) => {
                        const optionValue = option.value ?? index;
                        const isChecked = (answers[question.id] || []).includes(optionValue);
                        return (
                          <div 
                            key={index} 
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-smooth ${
                              isChecked ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                            }`}
                            onClick={() => handleMultiAnswer(question.id, optionValue, !isChecked)}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => handleMultiAnswer(question.id, optionValue, !!checked)}
                            />
                            <Label className={`flex-1 cursor-pointer text-base ${isArabic ? 'text-right' : 'text-left'}`}>{option.text}</Label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <RadioGroup
                      value={answers[question.id]?.toString() || ""}
                      onValueChange={(value) => {
                        handleAnswer(question.id, parseInt(value));
                      }}
                      className="space-y-3"
                    >
                      {question.options.map((option, index) => {
                        const optionValue = option.value ?? index;
                        const isSelected = answers[question.id] === optionValue;
                        return (
                          <div 
                            key={index} 
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-smooth ${
                              isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                            }`}
                            onClick={() => handleAnswer(question.id, optionValue)}
                          >
                            <RadioGroupItem
                              value={optionValue.toString()}
                              id={`option-${index}`}
                            />
                            <Label htmlFor={`option-${index}`} className={`flex-1 cursor-pointer text-base ${isArabic ? 'text-right' : 'text-left'}`}>
                              {option.text}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6 gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="transition-smooth"
            >
              <ArrowLeft className={`w-4 h-4 ${isArabic ? "ml-2 rotate-180" : "mr-2"}`} />
              {t.previous}
            </Button>
            <Button onClick={handleNext} className="transition-smooth">
              {isLast ? t.submit : t.next}
              <ArrowRight className={`w-4 h-4 ${isArabic ? "mr-2 rotate-180" : "ml-2"}`} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderSubmitting = () => (
    <div className="min-h-screen flex items-center justify-center bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium font-display">{t.submitting}</p>
        <p className="text-muted-foreground">{t.pleaseWait}</p>
      </div>
    </div>
  );

  const renderCompleted = () => {
    const orgData = completedData?.organization || assessmentData?.organization;
    const orgLogo = orgData?.logoUrl;
    const orgName = orgData?.name;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={isArabic ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full text-center shadow-elegant">
          <CardContent className="pt-10 pb-10">
            {orgLogo ? (
              <img src={orgLogo} alt={orgName} className="h-12 mx-auto mb-6 object-contain" />
            ) : orgName ? (
              <div className="flex items-center justify-center gap-2 mb-6">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-semibold">{orgName}</span>
              </div>
            ) : null}
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold mb-3 font-display">{t.thankYou}</h1>
            <p className="text-muted-foreground">{t.submittedSuccess}</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderResults = () => {
    const results = submissionResults?.results || completedData;
    const scoreSummary = results?.scoreSummary || results?.participant?.score_summary || completedData?.participant?.score_summary;
    const aiReport = results?.aiReport || completedData?.participant?.ai_report_text;
    const isGraded = assessmentData?.assessment?.is_graded ?? completedData?.assessment?.is_graded;
    const orgData = completedData?.organization || assessmentData?.organization;
    const orgLogo = orgData?.logoUrl;
    const orgName = orgData?.name || "Organization";
    const resultPrimaryColor = orgData?.primaryColor || primaryColor;

    const participantName = completedData?.participant?.full_name || submissionResults?.results?.participantName || regForm.full_name || "Participant";
    const participantEmail = completedData?.participant?.email || submissionResults?.results?.participantEmail || regForm.email || "";
    const assessmentTitle = completedData?.assessment?.title || assessmentData?.assessment?.title || "Assessment";
    const assessmentType = completedData?.assessment?.type || assessmentData?.assessment?.type || "general";
    const groupName = completedData?.assessmentGroup?.name || assessmentData?.assessmentGroup?.name || "Assessment Group";
    const completedAt = completedData?.participant?.completed_at || new Date().toISOString();

    return (
      <div className="min-h-screen bg-background p-4" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto py-8">
          <Card className="shadow-elegant overflow-hidden">
            {/* Header with branding */}
            <div 
              className="p-6 text-center"
              style={{ 
                background: `linear-gradient(135deg, ${resultPrimaryColor}15, ${resultPrimaryColor}05)`,
                borderBottom: `3px solid ${resultPrimaryColor}40`
              }}
            >
              {orgLogo ? (
                <img src={orgLogo} alt={orgName} className="h-12 mx-auto mb-4 object-contain" />
              ) : (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Building2 className="w-6 h-6" style={{ color: resultPrimaryColor }} />
                  <span className="font-semibold text-lg">{orgName}</span>
                </div>
              )}
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-display font-bold">{t.assessmentComplete}</h1>
              <p className="text-muted-foreground mt-1">{assessmentTitle}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {participantName} • {new Date(completedAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <CardContent className="p-6 space-y-6">
              {isGraded && scoreSummary && (
                <div className="text-center p-8 bg-muted rounded-xl">
                  <div 
                    className="text-6xl font-bold mb-2 font-display" 
                    style={{ color: resultPrimaryColor }}
                  >
                    {scoreSummary.percentage}%
                  </div>
                  <p className="text-muted-foreground text-lg">
                    {scoreSummary.correctCount} {t.of} {scoreSummary.totalPossible} {t.correct}
                  </p>
                  <div 
                    className="mt-4 inline-block px-4 py-2 rounded-full font-semibold"
                    style={{ 
                      backgroundColor: `${resultPrimaryColor}15`,
                      color: resultPrimaryColor
                    }}
                  >
                    {t.grade}: {scoreSummary.grade}
                  </div>
                </div>
              )}

              {!isGraded && scoreSummary?.traits && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg font-display">{t.yourProfile}</h3>
                  <div className="space-y-3">
                    {Object.entries(scoreSummary.traits).map(([trait, score]: [string, any]) => (
                      <div key={trait} className="p-4 bg-muted rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="capitalize font-medium">{trait}</span>
                          <span className="text-sm font-semibold" style={{ color: resultPrimaryColor }}>
                            {typeof score === 'number' ? score.toFixed(1) : score}/5
                          </span>
                        </div>
                        <div className="h-2 bg-background rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(typeof score === 'number' ? score : parseFloat(score)) / 5 * 100}%`,
                              backgroundColor: resultPrimaryColor
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiReport && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg font-display mb-4">{t.personalizedFeedback}</h3>
                  <div 
                    className="prose prose-sm max-w-none p-5 rounded-xl border"
                    style={{ 
                      backgroundColor: `${resultPrimaryColor}05`,
                      borderColor: `${resultPrimaryColor}20`
                    }}
                  >
                    <p 
                      dir={isArabic ? "rtl" : "ltr"}
                      className={`whitespace-pre-wrap leading-relaxed text-foreground/80 ${isArabic ? "text-right" : "text-left"}`}
                      style={{ unicodeBidi: "plaintext" }}
                    >
                      {aiReport}
                    </p>
                  </div>
                </div>
              )}

              {(results?.allowPdfDownload || completedData?.allowPdfDownload) && (
                <div className="text-center pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="transition-smooth"
                    onClick={() => {
                      openParticipantPrintPreview(
                        {
                          participantName,
                          participantEmail,
                          employeeCode: completedData?.participant?.employee_code,
                          department: completedData?.participant?.department,
                          groupName,
                          assessmentTitle,
                          assessmentType,
                          completedAt,
                          scoreSummary: scoreSummary || null,
                          aiReport: aiReport || null,
                        },
                        {
                          name: orgName,
                          logoUrl: orgLogo,
                          primaryColor: resultPrimaryColor,
                        },
                        isArabic ? 'ar' : 'en'
                      );
                    }}
                  >
                    <Download className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                    {t.downloadPdf}
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
    case "closed": return renderClosed();
    case "register": return renderRegister();
    case "intro": return renderIntro();
    case "questions": return renderQuestions();
    case "submitting": return renderSubmitting();
    case "completed": return renderCompleted();
    case "results": return renderResults();
    default: return renderLoading();
  }
}
