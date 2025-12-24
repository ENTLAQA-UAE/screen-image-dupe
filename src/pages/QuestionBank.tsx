import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { toast } from "sonner";
import {
  Search,
  Plus,
  Filter,
  Trash2,
  Pencil,
  Library,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  FileText,
  User,
  X,
  Tag,
  CheckCircle,
} from "lucide-react";

interface QuestionBankItem {
  id: string;
  text: string;
  type: string;
  options: any[];
  correct_answer: any;
  language: string;
  assessment_type: string | null;
  difficulty: string | null;
  tags: string[];
  subdomain: string | null;
  created_at: string;
}

const ASSESSMENT_TYPE_ICONS: Record<string, any> = {
  cognitive: Brain,
  personality: Heart,
  situational: MessageSquare,
  language: Languages,
  behavioral: User,
  generic_quiz: FileText,
  generic_profile: FileText,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  hard: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function QuestionBank() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("");
  
  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankItem | null>(null);
  
  // Edit form
  const [editForm, setEditForm] = useState({
    text: "",
    type: "mcq_single",
    options: [] as any[],
    correct_answer: null as any,
    language: "en",
    assessment_type: "",
    difficulty: "medium",
    tags: [] as string[],
    subdomain: "",
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    fetchOrganization();
  }, [user]);

  useEffect(() => {
    if (organizationId) {
      fetchQuestions();
    }
  }, [organizationId]);

  const fetchOrganization = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    setOrganizationId(data?.organization_id || null);
  };

  const fetchQuestions = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("question_bank")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setQuestions((data || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        tags: Array.isArray(q.tags) ? q.tags : [],
      })));
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load question bank");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question: QuestionBankItem) => {
    setSelectedQuestion(question);
    setEditForm({
      text: question.text,
      type: question.type,
      options: question.options || [],
      correct_answer: question.correct_answer,
      language: question.language,
      assessment_type: question.assessment_type || "",
      difficulty: question.difficulty || "medium",
      tags: question.tags || [],
      subdomain: question.subdomain || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedQuestion) return;
    try {
      const { error } = await supabase
        .from("question_bank")
        .update({
          text: editForm.text,
          type: editForm.type,
          options: editForm.options,
          correct_answer: editForm.correct_answer,
          language: editForm.language,
          assessment_type: editForm.assessment_type || null,
          difficulty: editForm.difficulty,
          tags: editForm.tags,
          subdomain: editForm.subdomain || null,
        })
        .eq("id", selectedQuestion.id);

      if (error) throw error;
      toast.success("Question updated successfully");
      setEditDialogOpen(false);
      fetchQuestions();
    } catch (error: any) {
      console.error("Error updating question:", error);
      toast.error("Failed to update question");
    }
  };

  const handleDelete = async () => {
    if (!selectedQuestion) return;
    try {
      const { error } = await supabase
        .from("question_bank")
        .delete()
        .eq("id", selectedQuestion.id);

      if (error) throw error;
      toast.success("Question deleted from bank");
      setDeleteDialogOpen(false);
      fetchQuestions();
    } catch (error: any) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !editForm.tags.includes(newTag.trim())) {
      setEditForm({ ...editForm, tags: [...editForm.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setEditForm({ ...editForm, tags: editForm.tags.filter((t) => t !== tag) });
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...editForm.options];
    newOptions[index] = { ...newOptions[index], text };
    setEditForm({ ...editForm, options: newOptions });
  };

  const addOption = () => {
    setEditForm({ ...editForm, options: [...editForm.options, { text: "" }] });
  };

  const removeOption = (index: number) => {
    const newOptions = editForm.options.filter((_, i) => i !== index);
    setEditForm({ ...editForm, options: newOptions });
  };

  // Apply filters
  const filteredQuestions = questions.filter((q) => {
    if (searchTerm && !q.text.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterType !== "all" && q.assessment_type !== filterType) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
    if (filterLanguage !== "all" && q.language !== filterLanguage) return false;
    if (filterTag && !q.tags?.some((t) => t.toLowerCase().includes(filterTag.toLowerCase()))) return false;
    return true;
  });

  // Get unique tags for filter suggestions
  const allTags = [...new Set(questions.flatMap((q) => q.tags || []))];

  const getTypeIcon = (type: string | null) => {
    const Icon = ASSESSMENT_TYPE_ICONS[type || ""] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <DashboardLayout activeItem="Question Bank">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center shadow-glow">
              <Library className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Question Bank</h1>
              <p className="text-muted-foreground">Manage your reusable assessment questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {questions.length} Questions
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cognitive">Cognitive</SelectItem>
                  <SelectItem value="personality">Personality</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="situational">Situational</SelectItem>
                  <SelectItem value="language">Language</SelectItem>
                  <SelectItem value="generic_quiz">Generic Quiz</SelectItem>
                  <SelectItem value="generic_profile">Generic Profile</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-48">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by tag..."
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="pl-10"
                  list="tags-list"
                />
                <datalist id="tags-list">
                  {allTags.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Library className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <h3 className="font-semibold text-lg mb-2">No questions found</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  {questions.length === 0
                    ? "Your question bank is empty. Save questions from the Assessment Builder to build your library."
                    : "No questions match your current filters. Try adjusting your search criteria."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="font-medium truncate">{question.text}</p>
                          {question.subdomain && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Subdomain: {question.subdomain}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(question.assessment_type)}
                          <span className="text-sm capitalize">
                            {question.assessment_type?.replace("_", " ") || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {question.difficulty ? (
                          <Badge
                            variant="outline"
                            className={DIFFICULTY_COLORS[question.difficulty]}
                          >
                            {question.difficulty}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {question.language === "ar" ? "العربية" : "English"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-32">
                          {question.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(question.tags?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{question.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(question)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedQuestion(question);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
              <DialogDescription>
                Update the question details and metadata
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Textarea
                  value={editForm.text}
                  onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={editForm.type}
                    onValueChange={(v) => setEditForm({ ...editForm, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq_single">Multiple Choice (Single)</SelectItem>
                      <SelectItem value="mcq_multi">Multiple Choice (Multi)</SelectItem>
                      <SelectItem value="likert">Likert Scale</SelectItem>
                      <SelectItem value="open_text">Open Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assessment Type</Label>
                  <Select
                    value={editForm.assessment_type}
                    onValueChange={(v) => setEditForm({ ...editForm, assessment_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cognitive">Cognitive</SelectItem>
                      <SelectItem value="personality">Personality</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="situational">Situational</SelectItem>
                      <SelectItem value="language">Language</SelectItem>
                      <SelectItem value="generic_quiz">Generic Quiz</SelectItem>
                      <SelectItem value="generic_profile">Generic Profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={editForm.difficulty}
                    onValueChange={(v) => setEditForm({ ...editForm, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={editForm.language}
                    onValueChange={(v) => setEditForm({ ...editForm, language: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subdomain</Label>
                <Input
                  value={editForm.subdomain}
                  onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value })}
                  placeholder="e.g., numerical, verbal, grammar..."
                />
              </div>

              {/* Options */}
              {editForm.type !== "open_text" && (
                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  <div className="space-y-2">
                    {editForm.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={opt.text || ""}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                        />
                        {editForm.type === "mcq_single" && (
                          <Button
                            variant={
                              editForm.correct_answer?.index === idx ? "default" : "outline"
                            }
                            size="icon"
                            onClick={() =>
                              setEditForm({ ...editForm, correct_answer: { index: idx } })
                            }
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(idx)}
                          disabled={editForm.options.length <= 2}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addOption}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Question</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this question from your bank? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
