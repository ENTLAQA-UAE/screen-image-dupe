import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  Settings2,
  Zap,
  ClipboardCheck,
  User,
  Trash2,
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  X,
  Save,
  Library,
  Timer,
} from "lucide-react";

// Assessment types
const ASSESSMENT_TYPES = {
  graded: [
    { value: "cognitive", label: "Cognitive Assessment", icon: Brain, description: "IQ-style tests measuring reasoning, problem-solving, and analytical skills" },
    { value: "language", label: "Language Assessment", icon: Languages, description: "English/Arabic proficiency testing grammar, vocabulary, and comprehension" },
    { value: "situational", label: "Situational Judgment (SJT)", icon: MessageSquare, description: "Workplace scenarios measuring decision-making and competencies" },
    { value: "generic_quiz", label: "Generic Quiz", icon: FileText, description: "Custom knowledge-based quiz with correct answers" },
  ],
  profile: [
    { value: "personality", label: "Personality Profile", icon: Heart, description: "Big Five-based personality assessment for behavioral insights" },
    { value: "behavioral", label: "Behavioral Assessment (FBA)", icon: User, description: "Functional behavioral analysis for workplace patterns" },
    { value: "generic_profile", label: "Generic Profile", icon: ClipboardCheck, description: "Custom profile assessment with trait-based scoring" },
  ],
};

// Config fields per type - competencies will be loaded dynamically
const TYPE_CONFIGS: Record<string, { fields: Array<{ key: string; label: string; type: string; options?: string[]; default?: any; dynamic?: boolean }> }> = {
  cognitive: {
    fields: [
      { key: "subdomains", label: "Subdomains to include", type: "multiselect", options: ["numerical", "verbal", "logical", "spatial", "memory"] },
      { key: "difficultyDistribution", label: "Difficulty Distribution", type: "select", options: ["mixed", "easy", "medium", "hard"] },
    ],
  },
  personality: {
    fields: [
      { key: "traits", label: "Traits to measure", type: "multiselect", options: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"] },
      { key: "questionsPerTrait", label: "Questions per trait", type: "number", default: 5 },
    ],
  },
  behavioral: {
    fields: [
      { key: "domains", label: "Behavior domains", type: "multiselect", options: ["antecedents", "behaviors", "consequences", "frequency"] },
    ],
  },
  situational: {
    fields: [
      { key: "competencies", label: "Competencies to measure", type: "multiselect", options: [], dynamic: true },
      { key: "scenarioCount", label: "Number of scenarios", type: "number", default: 8 },
    ],
  },
  language: {
    fields: [
      { key: "skills", label: "Skills to assess", type: "multiselect", options: ["grammar", "vocabulary", "reading-comprehension"] },
      { key: "proficiencyLevel", label: "Target proficiency", type: "select", options: ["basic", "intermediate", "advanced"] },
    ],
  },
  generic_quiz: { fields: [] },
  generic_profile: {
    fields: [
      { key: "customTraits", label: "Custom traits/dimensions (comma-separated)", type: "text" },
    ],
  },
};

interface Competency {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
}

interface GeneratedQuestion {
  text: string;
  type: string;
  options: Array<{ text: string; value?: number; score?: number }>;
  correctAnswer?: number;
  scoringLogic?: Record<string, any>;
  metadata?: Record<string, any>;
}

export default function AssessmentBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Step 1: Category
  const [category, setCategory] = useState<"graded_quiz" | "profile">("graded_quiz");
  
  // Step 2: Type
  const [assessmentType, setAssessmentType] = useState("");
  
  // Step 3: Setup Mode
  const [setupMode, setSetupMode] = useState<"quick" | "advanced">("advanced");
  
  // Step 4: Configuration
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "en" as "en" | "ar",
    questionCount: 20,
    difficulty: "mixed" as "easy" | "medium" | "hard" | "mixed",
    showResultsToEmployee: true,
    allowEmployeePdfDownload: false,
    aiFeedbackEnabled: true,
    timeLimit: 0, // 0 means no limit, otherwise in minutes
    timeLimitEnabled: false,
  });
  const [typeConfig, setTypeConfig] = useState<Record<string, any>>({});
  
  // Step 5: Generated Questions
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<GeneratedQuestion | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [savingToBank, setSavingToBank] = useState(false);
  
  // Import from bank
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<Set<string>>(new Set());
  const [loadingBank, setLoadingBank] = useState(false);
  
  // Organization competencies
  const [orgCompetencies, setOrgCompetencies] = useState<Competency[]>([]);

  useEffect(() => {
    const fetchOrgAndCompetencies = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      
      if (data?.organization_id) {
        setOrganizationId(data.organization_id);
        
        // Fetch organization's competencies
        const { data: competencies } = await supabase
          .from("competencies")
          .select("id, name, name_ar, description")
          .eq("organization_id", data.organization_id)
          .eq("is_active", true)
          .order("name");
        
        if (competencies) {
          setOrgCompetencies(competencies);
        }
      }
    };
    fetchOrgAndCompetencies();
  }, [user]);

  const handleGenerateQuestions = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please fill in the title and description");
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-questions", {
        body: {
          assessmentType,
          category,
          language: formData.language,
          description: formData.description,
          questionCount: formData.questionCount,
          difficulty: formData.difficulty,
          config: typeConfig,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { questions } = response.data;
      if (!questions?.length) {
        throw new Error("No questions generated");
      }

      setGeneratedQuestions(questions);
      setStep(5);
      toast.success(`Generated ${questions.length} questions`);
    } catch (error: any) {
      console.error("Error generating questions:", error);
      toast.error(error.message || "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!organizationId || !user) {
      toast.error("Organization not found");
      return;
    }

    setSaving(true);
    try {
      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from("assessments")
        .insert({
          organization_id: organizationId,
          title: formData.title,
          description: formData.description,
          type: assessmentType,
          language: formData.language,
          is_graded: category === "graded_quiz",
          status: "draft",
          created_by: user.id,
          config: {
            showResultsToEmployee: formData.showResultsToEmployee,
            allowEmployeePdfDownload: formData.allowEmployeePdfDownload,
            aiFeedbackEnabled: formData.aiFeedbackEnabled,
            timeLimit: formData.timeLimitEnabled ? formData.timeLimit : null,
            ...typeConfig,
          },
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create questions
      const questionsToInsert = generatedQuestions.map((q, index) => ({
        assessment_id: assessment.id,
        organization_id: organizationId,
        type: q.type,
        text: q.text,
        options: q.options,
        correct_answer: q.correctAnswer !== undefined ? { index: q.correctAnswer } : q.scoringLogic,
        order_index: index,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast.success("Assessment created successfully!");
      navigate(`/assessments`);
    } catch (error: any) {
      console.error("Error saving assessment:", error);
      toast.error(error.message || "Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };

  const updateTypeConfig = (key: string, value: any) => {
    setTypeConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMultiselect = (key: string, option: string) => {
    const current = typeConfig[key] || [];
    const updated = current.includes(option)
      ? current.filter((o: string) => o !== option)
      : [...current, option];
    updateTypeConfig(key, updated);
  };

  // Question Management Functions
  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== index));
    toast.success("Question deleted");
  };

  const handleStartEditQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setEditingQuestion({ ...generatedQuestions[index] });
  };

  const handleCancelEdit = () => {
    setEditingQuestionIndex(null);
    setEditingQuestion(null);
  };

  const handleSaveEdit = () => {
    if (editingQuestionIndex === null || !editingQuestion) return;
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => (i === editingQuestionIndex ? editingQuestion : q))
    );
    setEditingQuestionIndex(null);
    setEditingQuestion(null);
    toast.success("Question updated");
  };

  const handleUpdateEditingQuestion = (field: string, value: any) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, [field]: value });
  };

  const handleUpdateEditingOption = (optionIndex: number, field: string, value: any) => {
    if (!editingQuestion) return;
    const newOptions = [...editingQuestion.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleAddOption = () => {
    if (!editingQuestion) return;
    const newOptions = [...editingQuestion.options, { text: "" }];
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (!editingQuestion) return;
    const newOptions = editingQuestion.options.filter((_, i) => i !== optionIndex);
    // Adjust correctAnswer if needed
    let correctAnswer = editingQuestion.correctAnswer;
    if (correctAnswer !== undefined) {
      if (optionIndex === correctAnswer) {
        correctAnswer = undefined;
      } else if (optionIndex < correctAnswer) {
        correctAnswer = correctAnswer - 1;
      }
    }
    setEditingQuestion({ ...editingQuestion, options: newOptions, correctAnswer });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newQuestions = [...generatedQuestions];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    setGeneratedQuestions(newQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleAddManualQuestion = () => {
    const newQuestion: GeneratedQuestion = {
      text: "",
      type: category === "graded_quiz" ? "mcq_single" : "likert",
      options: [
        { text: "" },
        { text: "" },
        { text: "" },
        { text: "" },
      ],
      correctAnswer: category === "graded_quiz" ? 0 : undefined,
      metadata: {},
    };
    setGeneratedQuestions((prev) => [...prev, newQuestion]);
    setEditingQuestionIndex(generatedQuestions.length);
    setEditingQuestion(newQuestion);
  };

  const handleSaveQuestionToBank = async (questionIndex: number) => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }
    
    const question = generatedQuestions[questionIndex];
    try {
      const { error } = await supabase.from("question_bank").insert({
        organization_id: organizationId,
        text: question.text,
        type: question.type,
        options: question.options,
        correct_answer: question.correctAnswer !== undefined 
          ? { index: question.correctAnswer } 
          : question.scoringLogic,
        language: formData.language,
        assessment_type: assessmentType,
        difficulty: question.metadata?.difficulty || formData.difficulty,
        subdomain: question.metadata?.subdomain || question.metadata?.trait || null,
        tags: [assessmentType, formData.difficulty].filter(Boolean),
      });
      
      if (error) throw error;
      toast.success("Question saved to bank");
    } catch (error: any) {
      console.error("Error saving to bank:", error);
      toast.error("Failed to save question to bank");
    }
  };

  const handleSaveAllToBank = async () => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }
    
    if (generatedQuestions.length === 0) {
      toast.error("No questions to save");
      return;
    }
    
    setSavingToBank(true);
    try {
      const questionsToInsert = generatedQuestions.map((q) => ({
        organization_id: organizationId,
        text: q.text,
        type: q.type,
        options: q.options,
        correct_answer: q.correctAnswer !== undefined 
          ? { index: q.correctAnswer } 
          : q.scoringLogic,
        language: formData.language,
        assessment_type: assessmentType,
        difficulty: q.metadata?.difficulty || formData.difficulty,
        subdomain: q.metadata?.subdomain || q.metadata?.trait || null,
        tags: [assessmentType, formData.difficulty].filter(Boolean),
      }));
      
      const { error } = await supabase.from("question_bank").insert(questionsToInsert);
      
      if (error) throw error;
      toast.success(`${generatedQuestions.length} questions saved to bank`);
    } catch (error: any) {
      console.error("Error saving to bank:", error);
      toast.error("Failed to save questions to bank");
    } finally {
      setSavingToBank(false);
    }
  };

  const fetchBankQuestions = async () => {
    if (!organizationId) return;
    setLoadingBank(true);
    try {
      let query = supabase
        .from("question_bank")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      
      // Optionally filter by assessment type and language
      if (assessmentType) {
        query = query.eq("assessment_type", assessmentType);
      }
      if (formData.language) {
        query = query.eq("language", formData.language);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setBankQuestions((data || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        tags: Array.isArray(q.tags) ? q.tags : [],
      })));
    } catch (error: any) {
      console.error("Error fetching bank questions:", error);
      toast.error("Failed to load question bank");
    } finally {
      setLoadingBank(false);
    }
  };

  const handleOpenImportDialog = () => {
    setSelectedBankQuestions(new Set());
    fetchBankQuestions();
    setImportDialogOpen(true);
  };

  const toggleBankQuestionSelection = (questionId: string) => {
    const newSelection = new Set(selectedBankQuestions);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedBankQuestions(newSelection);
  };

  const handleImportSelectedQuestions = () => {
    const questionsToImport = bankQuestions
      .filter((q) => selectedBankQuestions.has(q.id))
      .map((q) => ({
        text: q.text,
        type: q.type,
        options: q.options,
        correctAnswer: q.correct_answer?.index,
        scoringLogic: q.correct_answer,
        metadata: {
          difficulty: q.difficulty,
          subdomain: q.subdomain,
        },
      }));
    
    setGeneratedQuestions((prev) => [...prev, ...questionsToImport]);
    setImportDialogOpen(false);
    toast.success(`Imported ${questionsToImport.length} questions`);
  };

  // Get type config with dynamic competencies
  const getTypeConfigWithCompetencies = () => {
    const config = TYPE_CONFIGS[assessmentType] || { fields: [] };
    if (assessmentType === "situational" && orgCompetencies.length > 0) {
      return {
        ...config,
        fields: config.fields.map(field => 
          field.key === "competencies" 
            ? { ...field, options: orgCompetencies.map(c => c.name) }
            : field
        ),
      };
    }
    return config;
  };
  
  const currentTypeConfig = getTypeConfigWithCompetencies();
  const availableTypes = category === "graded_quiz" ? ASSESSMENT_TYPES.graded : ASSESSMENT_TYPES.profile;

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Assessment Category</h2>
        <p className="text-muted-foreground">Select the type of assessment you want to create</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${category === "graded_quiz" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setCategory("graded_quiz")}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <ClipboardCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Graded Quiz</CardTitle>
            <CardDescription>
              Tests with correct answers and scoring. Perfect for cognitive, language, and knowledge assessments.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${category === "profile" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setCategory("profile")}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-accent" />
            </div>
            <CardTitle>Assessment / Profile</CardTitle>
            <CardDescription>
              Trait-based profiles without right/wrong answers. Ideal for personality and behavioral assessments.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Select Assessment Type</h2>
        <p className="text-muted-foreground">Choose the specific type of assessment</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {availableTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.value}
              className={`cursor-pointer transition-all hover:shadow-lg ${assessmentType === type.value ? "ring-2 ring-primary" : ""}`}
              onClick={() => setAssessmentType(type.value)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Setup Mode</h2>
        <p className="text-muted-foreground">How much control do you want over the configuration?</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${setupMode === "quick" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setSetupMode("quick")}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-success/10 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-success" />
            </div>
            <CardTitle>Quick Setup</CardTitle>
            <CardDescription>
              Get started fast with sensible defaults. AI will handle the details based on your description.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${setupMode === "advanced" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setSetupMode("advanced")}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Settings2 className="w-8 h-8 text-accent" />
            </div>
            <CardTitle>Advanced Setup</CardTitle>
            <CardDescription>
              Fine-tune subdomains, traits, difficulty, and psychometric parameters for precise assessments.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Configure Your Assessment</h2>
        <p className="text-muted-foreground">Provide details and settings for AI to generate questions</p>
      </div>
      
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assessment Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Cognitive Assessment for IT Managers"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you want to assess, the target role/level, and any specific focus areas..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This helps the AI understand what questions to generate
              </p>
            </div>
          </div>

          {/* Language & Questions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value: "en" | "ar") => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Number of Questions: {formData.questionCount}</Label>
              <Slider
                value={[formData.questionCount]}
                onValueChange={([value]) => setFormData({ ...formData, questionCount: value })}
                min={5}
                max={50}
                step={5}
                className="mt-2"
              />
            </div>
          </div>

          {/* Difficulty (for graded) */}
          {category === "graded_quiz" && (
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed (recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Type-specific config (Advanced mode only) */}
          {setupMode === "advanced" && currentTypeConfig.fields.length > 0 && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Type-Specific Settings
              </h3>
              
              {currentTypeConfig.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  
                  {field.type === "multiselect" && field.options && (
                    <div className="flex flex-wrap gap-2">
                      {field.options.map((option) => (
                        <Badge
                          key={option}
                          variant={(typeConfig[field.key] || []).includes(option) ? "default" : "outline"}
                          className="cursor-pointer capitalize"
                          onClick={() => toggleMultiselect(field.key, option)}
                        >
                          {option.replace("-", " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {field.type === "select" && field.options && (
                    <Select
                      value={typeConfig[field.key] || field.options[0]}
                      onValueChange={(value) => updateTypeConfig(field.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option} className="capitalize">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.type === "number" && (
                    <Input
                      type="number"
                      value={typeConfig[field.key] || field.default || ""}
                      onChange={(e) => updateTypeConfig(field.key, parseInt(e.target.value))}
                      min={1}
                      max={20}
                    />
                  )}
                  
                  {field.type === "text" && (
                    <Input
                      value={typeConfig[field.key] || ""}
                      onChange={(e) => updateTypeConfig(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Display Settings */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold">Display & Access Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Show results to employees</Label>
                <p className="text-xs text-muted-foreground">Employees can see their scores after completion</p>
              </div>
              <Switch
                checked={formData.showResultsToEmployee}
                onCheckedChange={(checked) => setFormData({ ...formData, showResultsToEmployee: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow PDF download for employees</Label>
                <p className="text-xs text-muted-foreground">Employees can download their report as PDF</p>
              </div>
              <Switch
                checked={formData.allowEmployeePdfDownload}
                onCheckedChange={(checked) => setFormData({ ...formData, allowEmployeePdfDownload: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable AI-generated feedback</Label>
                <p className="text-xs text-muted-foreground">AI will generate narrative interpretations of results</p>
              </div>
              <Switch
                checked={formData.aiFeedbackEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, aiFeedbackEnabled: checked })}
              />
            </div>
          </div>

          {/* Time Limit Settings */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Time Settings
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable time limit</Label>
                <p className="text-xs text-muted-foreground">Auto-submit when time expires</p>
              </div>
              <Switch
                checked={formData.timeLimitEnabled}
                onCheckedChange={(checked) => setFormData({ 
                  ...formData, 
                  timeLimitEnabled: checked,
                  timeLimit: checked && formData.timeLimit === 0 ? Math.ceil(formData.questionCount * 1.5) : formData.timeLimit
                })}
              />
            </div>

            {formData.timeLimitEnabled && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>Time limit (minutes)</Label>
                  <span className="text-sm font-medium">{formData.timeLimit} min</span>
                </div>
                <Slider
                  value={[formData.timeLimit]}
                  onValueChange={([value]) => setFormData({ ...formData, timeLimit: value })}
                  min={5}
                  max={180}
                  step={5}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 min</span>
                  <span>Recommended: ~{Math.ceil(formData.questionCount * 1.5)} min</span>
                  <span>180 min</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Review & Edit Questions</h2>
            <p className="text-muted-foreground">
              {generatedQuestions.length} questions. Drag to reorder, click to edit, or add new ones.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleOpenImportDialog}>
              <Library className="w-4 h-4 mr-2" />
              Import from Bank
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveAllToBank}
              disabled={savingToBank || generatedQuestions.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {savingToBank ? "Saving..." : "Save All to Bank"}
            </Button>
            <Button variant="outline" onClick={handleAddManualQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
            <Button variant="outline" onClick={() => setStep(4)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>
      
      <div className="space-y-3">
        {generatedQuestions.map((question, index) => (
          <Card 
            key={index}
            draggable={editingQuestionIndex !== index}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`transition-all ${draggedIndex === index ? "opacity-50 scale-[0.98]" : ""} ${editingQuestionIndex === index ? "ring-2 ring-primary" : ""}`}
          >
            <CardContent className="p-4">
              {editingQuestionIndex === index && editingQuestion ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge>Editing Question {index + 1}</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                      value={editingQuestion.text}
                      onChange={(e) => handleUpdateEditingQuestion("text", e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      <Button size="sm" variant="ghost" onClick={handleAddOption}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    {editingQuestion.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <Input
                          value={option.text}
                          onChange={(e) => handleUpdateEditingOption(optIndex, "text", e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          className="flex-1"
                        />
                        {category === "graded_quiz" && (
                          <Button
                            size="sm"
                            variant={editingQuestion.correctAnswer === optIndex ? "default" : "outline"}
                            onClick={() => handleUpdateEditingQuestion("correctAnswer", optIndex)}
                            className="shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        {category === "profile" && (
                          <Input
                            type="number"
                            value={option.value || ""}
                            onChange={(e) => handleUpdateEditingOption(optIndex, "value", parseInt(e.target.value))}
                            placeholder="Score"
                            className="w-20"
                          />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveOption(optIndex)}
                          className="text-destructive shrink-0"
                          disabled={editingQuestion.options.length <= 2}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start gap-3">
                  <div 
                    className="cursor-grab hover:bg-muted p-1 rounded"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-2">{question.text || <span className="text-muted-foreground italic">No question text</span>}</p>
                    <div className="space-y-1">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`text-sm px-3 py-1.5 rounded ${
                            question.correctAnswer === optIndex
                              ? "bg-success/10 text-success border border-success/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {option.text || <span className="italic">Empty option</span>}
                          {question.correctAnswer === optIndex && (
                            <CheckCircle2 className="w-3 h-3 inline ml-2" />
                          )}
                          {option.value !== undefined && (
                            <span className="text-xs ml-2">({option.value})</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {question.metadata && (
                      <div className="flex gap-2 mt-2">
                        {question.metadata.difficulty && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {question.metadata.difficulty}
                          </Badge>
                        )}
                        {question.metadata.subdomain && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {question.metadata.subdomain}
                          </Badge>
                        )}
                        {question.metadata.trait && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {question.metadata.trait}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSaveQuestionToBank(index)}
                      className="h-8 w-8"
                      title="Save to Question Bank"
                    >
                      <Library className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleStartEditQuestion(index)}
                      className="h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteQuestion(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {generatedQuestions.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
          <p className="text-muted-foreground mb-4">Go back to generate questions or add them manually.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setStep(4)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
            <Button onClick={handleAddManualQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Add Manually
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  );

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return !!assessmentType;
      case 3: return true;
      case 4: return formData.title && formData.description;
      case 5: return generatedQuestions.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 4) {
      handleGenerateQuestions();
    } else if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/assessments");
    }
  };

  return (
    <DashboardLayout activeItem="Assessments">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Assessment Builder</h1>
            <p className="text-muted-foreground">Step {step} of 5</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 max-w-2xl">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-4xl mx-auto">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          
          {step < 5 ? (
            <Button onClick={handleNext} disabled={!canProceed() || generating}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : step === 4 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Questions
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleSaveAssessment} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Assessment
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Import from Bank Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import from Question Bank</DialogTitle>
            <DialogDescription>
              Select questions to import. Showing {bankQuestions.length} questions matching your assessment type and language.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-96">
            {loadingBank ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : bankQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No questions found in your bank for this assessment type.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Difficulty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankQuestions.map((q) => (
                    <TableRow key={q.id} className="cursor-pointer" onClick={() => toggleBankQuestionSelection(q.id)}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedBankQuestions.has(q.id)}
                          onCheckedChange={() => toggleBankQuestionSelection(q.id)}
                        />
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate">{q.text}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{q.difficulty || "—"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleImportSelectedQuestions} disabled={selectedBankQuestions.size === 0}>
              Import {selectedBankQuestions.size} Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
