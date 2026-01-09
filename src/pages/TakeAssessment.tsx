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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
        </div>
        <p className="text-lg font-medium text-slate-600">{t.loading}</p>
      </motion.div>
    </div>
  );

  const renderError = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-100 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="text-center shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardContent className="pt-6 pb-8">
            <h1 className="text-2xl font-bold mb-2 font-display text-slate-800">{t.unableToLoad}</h1>
            <p className="text-slate-500">{errorMessage}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderNotStarted = () => {
    const orgData = errorOrganization;
    const assessmentTitle = errorAssessment?.title;
    
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 p-4" 
        dir={isArabic ? "rtl" : "ltr"}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="text-center shadow-2xl border-0 overflow-hidden">
            {orgData && (
              <div 
                className="p-4 bg-gradient-to-r from-amber-500 to-orange-500"
              >
                {orgData.logoUrl ? (
                  <img src={orgData.logoUrl} alt={orgData.name} className="h-10 mx-auto object-contain brightness-0 invert" />
                ) : (
                  <div className="flex items-center justify-center gap-2 text-white">
                    <Building2 className="w-5 h-5" />
                    <span className="font-semibold">{orgData.name}</span>
                  </div>
                )}
              </div>
            )}
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2 font-display text-slate-800">{t.notYetOpen}</h1>
              {assessmentTitle && (
                <p className="text-sm text-slate-500 mb-3 font-medium">{assessmentTitle}</p>
              )}
              <p className="text-slate-600">
                {t.notYetOpenDesc}{" "}
                <span className="font-semibold text-amber-600">
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
        </motion.div>
      </div>
    );
  };

  const renderExpired = () => {
    const orgData = errorOrganization;
    const assessmentTitle = errorAssessment?.title;
    
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-100 p-4" 
        dir={isArabic ? "rtl" : "ltr"}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="text-center shadow-2xl border-0 overflow-hidden">
            {orgData && (
              <div className="p-4 bg-gradient-to-r from-red-500 to-rose-500">
                {orgData.logoUrl ? (
                  <img src={orgData.logoUrl} alt={orgData.name} className="h-10 mx-auto object-contain brightness-0 invert" />
                ) : (
                  <div className="flex items-center justify-center gap-2 text-white">
                    <Building2 className="w-5 h-5" />
                    <span className="font-semibold">{orgData.name}</span>
                  </div>
                )}
              </div>
            )}
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2 font-display text-slate-800">{t.assessmentEnded}</h1>
              {assessmentTitle && (
                <p className="text-sm text-slate-500 mb-3 font-medium">{assessmentTitle}</p>
              )}
              <p className="text-slate-600">{t.assessmentEndedDesc}</p>
              {endDate && (
                <p className="text-xs text-slate-400 mt-3">
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
        </motion.div>
      </div>
    );
  };

  const renderClosed = () => {
    const orgData = errorOrganization;
    const assessmentTitle = errorAssessment?.title;
    
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-200 p-4" 
        dir={isArabic ? "rtl" : "ltr"}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="text-center shadow-2xl border-0 overflow-hidden">
            {orgData && (
              <div className="p-4 bg-gradient-to-r from-slate-500 to-gray-600">
                {orgData.logoUrl ? (
                  <img src={orgData.logoUrl} alt={orgData.name} className="h-10 mx-auto object-contain brightness-0 invert" />
                ) : (
                  <div className="flex items-center justify-center gap-2 text-white">
                    <Building2 className="w-5 h-5" />
                    <span className="font-semibold">{orgData.name}</span>
                  </div>
                )}
              </div>
            )}
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2 font-display text-slate-800">{t.assessmentClosed}</h1>
              {assessmentTitle && (
                <p className="text-sm text-slate-500 mb-3 font-medium">{assessmentTitle}</p>
              )}
              <p className="text-slate-600">{t.assessmentClosedDesc}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

  const renderRegister = () => (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100" 
      dir={isArabic ? "rtl" : "ltr"}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div 
            className="p-6 text-center text-white"
            style={{ 
              background: primaryColor ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` : 'linear-gradient(135deg, #3b82f6, #6366f1)'
            }}
          >
            {organization?.logoUrl ? (
              <img src={organization.logoUrl} alt={organization.name} className="h-14 mx-auto mb-4 object-contain brightness-0 invert" />
            ) : organization?.name ? (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Building2 className="w-6 h-6" />
                <span className="font-semibold text-lg">{organization.name}</span>
              </div>
            ) : null}
            <h2 className="text-xl font-display font-bold">{assessmentData?.assessment.title}</h2>
            <p className="text-white/80 mt-1">{t.provideInfo}</p>
          </div>
          <CardContent className="p-6 space-y-4">
            {/* Employee Code - First and Required */}
            <div className="space-y-2">
              <Label htmlFor="employee_code" className="flex items-center gap-1 text-slate-700">
                {t.employeeCode} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employee_code"
                value={regForm.employee_code}
                onChange={(e) => setRegForm({ ...regForm, employee_code: e.target.value })}
                placeholder={isArabic ? "أدخل رقم الموظف" : "Enter employee code"}
                className="border-slate-200 focus:border-blue-400 transition-all"
                style={{ textAlign: isArabic ? 'right' : 'left' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-1 text-slate-700">
                {t.fullName} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                value={regForm.full_name}
                onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                placeholder={isArabic ? "أدخل اسمك الكامل" : "Enter your full name"}
                className="border-slate-200 focus:border-blue-400 transition-all"
                style={{ textAlign: isArabic ? 'right' : 'left' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1 text-slate-700">
                {t.email} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                placeholder={isArabic ? "بريدك@الشركة.com" : "your.email@company.com"}
                className="border-slate-200 focus:border-blue-400 transition-all"
                style={{ textAlign: isArabic ? 'right' : 'left', direction: 'ltr' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-slate-700">{t.department}</Label>
                <Input
                  id="department"
                  value={regForm.department}
                  onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                  placeholder={isArabic ? "مثال: تقنية المعلومات" : "e.g., IT"}
                  className="border-slate-200 focus:border-blue-400 transition-all"
                  style={{ textAlign: isArabic ? 'right' : 'left' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title" className="text-slate-700">{t.jobTitle}</Label>
                <Input
                  id="job_title"
                  value={regForm.job_title}
                  onChange={(e) => setRegForm({ ...regForm, job_title: e.target.value })}
                  placeholder={isArabic ? "مثال: مدير" : "e.g., Manager"}
                  className="border-slate-200 focus:border-blue-400 transition-all"
                  style={{ textAlign: isArabic ? 'right' : 'left' }}
                />
              </div>
            </div>
            <Button 
              className="w-full mt-4 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
              size="lg" 
              onClick={handleRegister}
              style={{ 
                background: primaryColor ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` : 'linear-gradient(135deg, #3b82f6, #6366f1)'
              }}
            >
              {t.continue}
              <ArrowRight className={`w-5 h-5 ${isArabic ? "mr-2 rotate-180" : "ml-2"}`} />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderIntro = () => (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100" 
      dir={isArabic ? "rtl" : "ltr"}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header with gradient */}
          <div 
            className="p-6 text-center text-white"
            style={{ 
              background: primaryColor ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` : 'linear-gradient(135deg, #3b82f6, #6366f1)'
            }}
          >
            {organization?.logoUrl ? (
              <img src={organization.logoUrl} alt={organization.name} className="h-14 mx-auto mb-4 object-contain brightness-0 invert" />
            ) : organization?.name ? (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Building2 className="w-6 h-6" />
                <span className="font-semibold text-lg">{organization.name}</span>
              </div>
            ) : null}
            <h2 className="text-2xl font-display font-bold">{assessmentData?.assessment.title}</h2>
            <p className="text-white/80 mt-2 max-w-lg mx-auto">
              {assessmentData?.assessment.description || t.welcome}
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Assessment Info - Colorful Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-white/80">{t.questions}</p>
                  <p className="text-2xl font-bold">{assessmentData?.questions.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-white/80">
                    {assessmentData?.assessment.config?.timeLimit ? t.timeLimit : t.estimatedTime}
                  </p>
                  <p className="text-2xl font-bold">
                    {assessmentData?.assessment.config?.timeLimit || 
                     Math.ceil((assessmentData?.questions.length || 20) * 0.5)} <span className="text-base font-normal">{t.minutes}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3 bg-slate-50 rounded-xl p-5">
              <h3 className="font-semibold font-display text-slate-800 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">i</div>
                {t.instructions}
              </h3>
              <ul className={`space-y-3 ${isArabic ? "pr-2" : "pl-2"}`}>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-slate-600">{t.instruction1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-slate-600">{t.instruction2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-slate-600">{t.instruction3}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-slate-600">{t.instruction4}</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-amber-700 font-medium">{t.instruction5}</span>
                </li>
              </ul>
            </div>

            {/* Timer warning */}
            {timeRemaining !== null && (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">
                    {isArabic ? "تقييم محدد بوقت" : "Timed Assessment"}
                  </p>
                  <p className="text-sm text-white/90">
                    {isArabic 
                      ? `لديك ${Math.floor(timeRemaining / 60)} دقيقة لإكمال هذا التقييم. سيتم الإرسال تلقائياً عند انتهاء الوقت.`
                      : `You have ${Math.floor(timeRemaining / 60)} minutes to complete this assessment. It will auto-submit when time expires.`
                    }
                  </p>
                </div>
              </div>
            )}

            {assessmentData?.participant && (
              <div className="text-center p-3 bg-slate-100 rounded-xl">
                <p className="text-sm text-slate-600">
                  {t.takingAs}: <strong className="text-slate-800">{assessmentData.participant.full_name}</strong>
                </p>
              </div>
            )}

            <Button 
              className="w-full h-14 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all" 
              size="lg" 
              onClick={handleStartAssessment}
              style={{ 
                background: primaryColor ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` : 'linear-gradient(135deg, #3b82f6, #6366f1)'
              }}
            >
              {t.startAssessment}
              <ArrowRight className={`w-6 h-6 ${isArabic ? "mr-2 rotate-180" : "ml-2"}`} />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderQuestions = () => {
    if (!assessmentData) return null;

    const question = assessmentData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / assessmentData.questions.length) * 100;
    const isLast = currentQuestionIndex === assessmentData.questions.length - 1;
    const isMultiSelect = question.type === "mcq_multi";

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir={isArabic ? "rtl" : "ltr"}>
        {/* Header with progress and timer */}
        <div 
          className="sticky top-0 z-10 backdrop-blur-md border-b border-white/20 shadow-sm"
          style={{ 
            background: primaryColor ? `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}dd)` : 'linear-gradient(135deg, #3b82f6ee, #6366f1dd)'
          }}
        >
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/90 font-medium">
                {t.questionOf
                  .replace("{current}", String(currentQuestionIndex + 1))
                  .replace("{total}", String(assessmentData.questions.length))}
              </span>
              {timeRemaining !== null && (
                <motion.div 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                    timeRemaining < 60 ? "bg-red-500 text-white" : 
                    timeRemaining < 300 ? "bg-amber-400 text-amber-900" : 
                    "bg-white/20 text-white backdrop-blur-sm"
                  }`}
                  animate={timeRemaining < 60 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Timer className={`w-4 h-4 ${timeRemaining < 60 ? "animate-pulse" : ""}`} />
                  <span className="font-mono text-sm">{formatTime(timeRemaining)}</span>
                  {timeRemaining < 60 && (
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  )}
                </motion.div>
              )}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
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
              <Card className="shadow-2xl border-0 overflow-hidden">
                <CardContent className="p-8" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ 
                        background: primaryColor ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` : 'linear-gradient(135deg, #3b82f6, #6366f1)'
                      }}
                    >
                      {currentQuestionIndex + 1}
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                  </div>
                  
                  <h2 
                    className={`text-xl font-semibold mb-8 font-display leading-relaxed text-slate-800 ${isArabic ? 'text-right' : 'text-left'}`}
                    style={{ unicodeBidi: 'plaintext' }}
                  >
                    {question.text}
                  </h2>

                  {isMultiSelect ? (
                    <div className="space-y-3">
                      {question.options.map((option, index) => {
                        const optionValue = option.value ?? index;
                        const isChecked = (answers[question.id] || []).includes(optionValue);
                        return (
                          <motion.div 
                            key={index}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                              isChecked 
                                ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md" 
                                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                            }`}
                            onClick={() => handleMultiAnswer(question.id, optionValue, !isChecked)}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => handleMultiAnswer(question.id, optionValue, !!checked)}
                              className="w-5 h-5"
                            />
                            <Label 
                              className={`flex-1 cursor-pointer text-base text-slate-700 ${isArabic ? 'text-right' : 'text-left'}`}
                              style={{ unicodeBidi: 'plaintext' }}
                            >
                              {option.text}
                            </Label>
                          </motion.div>
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
                          <motion.div 
                            key={index}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected 
                                ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md" 
                                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                            }`}
                            onClick={() => handleAnswer(question.id, optionValue)}
                          >
                            <RadioGroupItem
                              value={optionValue.toString()}
                              id={`option-${index}`}
                              className="w-5 h-5"
                            />
                            <Label 
                              htmlFor={`option-${index}`} 
                              className={`flex-1 cursor-pointer text-base text-slate-700 ${isArabic ? 'text-right' : 'text-left'}`}
                              style={{ unicodeBidi: 'plaintext' }}
                            >
                              {option.text}
                            </Label>
                          </motion.div>
                        );
                      })}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="h-12 px-6 bg-white shadow-lg hover:shadow-xl border-slate-200"
            >
              <ArrowLeft className={`w-5 h-5 ${isArabic ? "ml-2 rotate-180" : "mr-2"}`} />
              {t.previous}
            </Button>
            <Button 
              onClick={handleNext} 
              className="h-12 px-8 shadow-lg hover:shadow-xl"
              style={{ 
                background: primaryColor ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` : 'linear-gradient(135deg, #3b82f6, #6366f1)'
              }}
            >
              {isLast ? t.submit : t.next}
              <ArrowRight className={`w-5 h-5 ${isArabic ? "mr-2 rotate-180" : "ml-2"}`} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderSubmitting = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100" dir={isArabic ? "rtl" : "ltr"}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
          style={{ 
            background: primaryColor ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` : 'linear-gradient(135deg, #3b82f6, #6366f1)'
          }}
        >
          <Loader2 className="w-12 h-12 animate-spin text-white" />
        </div>
        <p className="text-xl font-semibold font-display text-slate-800">{t.submitting}</p>
        <p className="text-slate-500 mt-1">{t.pleaseWait}</p>
      </motion.div>
    </div>
  );

  const renderCompleted = () => {
    const orgData = completedData?.organization || assessmentData?.organization;
    const orgLogo = orgData?.logoUrl;
    const orgName = orgData?.name;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 p-4" dir={isArabic ? "rtl" : "ltr"}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="text-center shadow-2xl border-0 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-emerald-500 to-green-500">
              {orgLogo ? (
                <img src={orgLogo} alt={orgName} className="h-12 mx-auto object-contain brightness-0 invert" />
              ) : orgName ? (
                <div className="flex items-center justify-center gap-2 text-white">
                  <Building2 className="w-5 h-5" />
                  <span className="font-semibold">{orgName}</span>
                </div>
              ) : null}
            </div>
            <CardContent className="pt-8 pb-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-3 font-display text-slate-800">{t.thankYou}</h1>
              <p className="text-slate-500">{t.submittedSuccess}</p>
            </CardContent>
          </Card>
        </motion.div>
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 p-4" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-2xl border-0 overflow-hidden">
              {/* Header with gradient branding */}
              <div 
                className="p-6 text-center text-white"
                style={{ 
                  background: resultPrimaryColor ? `linear-gradient(135deg, ${resultPrimaryColor}, ${resultPrimaryColor}dd)` : 'linear-gradient(135deg, #10b981, #059669)'
                }}
              >
                {orgLogo ? (
                  <img src={orgLogo} alt={orgName} className="h-14 mx-auto mb-4 object-contain brightness-0 invert" />
                ) : (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Building2 className="w-6 h-6" />
                    <span className="font-semibold text-lg">{orgName}</span>
                  </div>
                )}
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold">{t.assessmentComplete}</h1>
                <p className="text-white/80 mt-2">{assessmentTitle}</p>
                <p className="text-sm text-white/70 mt-2">
                  {participantName} • {new Date(completedAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <CardContent className="p-6 space-y-6">
                {isGraded && scoreSummary && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center p-8 bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl shadow-inner"
                  >
                    <div 
                      className="text-7xl font-bold mb-3 font-display bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent"
                    >
                      {scoreSummary.percentage}%
                    </div>
                    <p className="text-slate-600 text-lg">
                      {scoreSummary.correctCount} {t.of} {scoreSummary.totalPossible} {t.correct}
                    </p>
                    <div 
                      className="mt-4 inline-block px-6 py-2 rounded-full font-semibold text-white shadow-lg"
                      style={{ 
                        background: resultPrimaryColor ? `linear-gradient(135deg, ${resultPrimaryColor}, ${resultPrimaryColor}dd)` : 'linear-gradient(135deg, #10b981, #059669)'
                      }}
                    >
                      {t.grade}: {scoreSummary.grade}
                    </div>
                  </motion.div>
                )}

                {!isGraded && scoreSummary?.traits && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg font-display text-slate-800 flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ 
                          background: resultPrimaryColor ? `linear-gradient(135deg, ${resultPrimaryColor}, ${resultPrimaryColor}dd)` : 'linear-gradient(135deg, #10b981, #059669)'
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      {t.yourProfile}
                    </h3>
                    <div className="grid gap-3">
                      {Object.entries(scoreSummary.traits).map(([trait, score]: [string, any], index) => (
                        <motion.div 
                          key={trait} 
                          initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="capitalize font-medium text-slate-700">{trait}</span>
                            <span 
                              className="text-sm font-bold px-3 py-1 rounded-full text-white"
                              style={{ 
                                background: resultPrimaryColor ? `linear-gradient(135deg, ${resultPrimaryColor}, ${resultPrimaryColor}dd)` : 'linear-gradient(135deg, #10b981, #059669)'
                              }}
                            >
                              {typeof score === 'number' ? score.toFixed(1) : score}/5
                            </span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(typeof score === 'number' ? score : parseFloat(score)) / 5 * 100}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + (0.1 * index) }}
                              style={{ 
                                background: resultPrimaryColor ? `linear-gradient(90deg, ${resultPrimaryColor}, ${resultPrimaryColor}aa)` : 'linear-gradient(90deg, #10b981, #34d399)'
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {aiReport && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="border-t pt-6"
                  >
                    <h3 className="font-semibold text-lg font-display text-slate-800 mb-4 flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ 
                          background: resultPrimaryColor ? `linear-gradient(135deg, ${resultPrimaryColor}, ${resultPrimaryColor}dd)` : 'linear-gradient(135deg, #10b981, #059669)'
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      {t.personalizedFeedback}
                    </h3>
                    <div 
                      className="p-6 rounded-2xl border-2 shadow-inner"
                      style={{ 
                        backgroundColor: `${resultPrimaryColor}08`,
                        borderColor: `${resultPrimaryColor}30`
                      }}
                    >
                      <p 
                        dir={isArabic ? "rtl" : "ltr"}
                        className={`whitespace-pre-wrap leading-relaxed text-slate-700 ${isArabic ? "text-right" : "text-left"}`}
                        style={{ unicodeBidi: "plaintext" }}
                      >
                        {aiReport}
                      </p>
                    </div>
                  </motion.div>
                )}

                {(results?.allowPdfDownload || completedData?.allowPdfDownload) && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center pt-6 border-t"
                  >
                    <Button 
                      size="lg" 
                      className="h-14 px-8 text-base font-semibold shadow-xl hover:shadow-2xl transition-all text-white"
                      style={{ 
                        background: resultPrimaryColor ? `linear-gradient(135deg, ${resultPrimaryColor}, ${resultPrimaryColor}dd)` : 'linear-gradient(135deg, #10b981, #059669)'
                      }}
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
                      <Download className={`w-5 h-5 ${isArabic ? "ml-2" : "mr-2"}`} />
                      {t.downloadPdf}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
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
