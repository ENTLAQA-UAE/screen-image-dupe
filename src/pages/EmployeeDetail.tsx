import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { generateParticipantPDF } from "@/lib/pdfGenerator";
import {
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  Mail,
  Hash,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Eye,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  Download,
  TrendingUp,
  Award,
  BarChart3,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface AssessmentHistory {
  id: string;
  assessment_id: string;
  assessment_title: string;
  assessment_type: string;
  group_name: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  score_summary: any;
  ai_report_text: string | null;
}

interface EmployeeData {
  email: string;
  full_name: string;
  department: string | null;
  job_title: string | null;
  employee_code: string | null;
  first_seen: string | null;
  organization_name: string;
}

interface EmployeeStats {
  totalAssessments: number;
  completed: number;
  inProgress: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  completionRate: number;
  scoresByType: { type: string; score: number }[];
  traitAverages: { trait: string; score: number; fullMark: number }[];
}

const getTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "cognitive": return Brain;
    case "personality": return Heart;
    case "situational": return MessageSquare;
    case "language": return Languages;
    default: return FileText;
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "completed":
      return { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Completed" };
    case "started":
      return { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "In Progress" };
    case "expired":
      return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Expired" };
    default:
      return { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: "Invited" };
  }
};

const EmployeeDetail = () => {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [assessments, setAssessments] = useState<AssessmentHistory[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [selectedReport, setSelectedReport] = useState<AssessmentHistory | null>(null);

  useEffect(() => {
    if (email && user) {
      fetchEmployeeData(decodeURIComponent(email));
    }
  }, [email, user]);

  const fetchEmployeeData = async (employeeEmail: string) => {
    setLoading(true);
    try {
      // Fetch user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.organization_id) {
        toast.error("Organization not found");
        navigate("/employees");
        return;
      }

      // Get organization name
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profile.organization_id)
        .maybeSingle();

      // Fetch all participants with this email
      const { data: participants, error } = await supabase
        .from("participants")
        .select(`
          *,
          assessment_groups!inner (
            id,
            name,
            assessments!inner (
              id,
              title,
              type,
              is_graded
            )
          )
        `)
        .eq("organization_id", profile.organization_id)
        .eq("email", employeeEmail)
        .order("completed_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (!participants || participants.length === 0) {
        toast.error("Employee not found");
        navigate("/employees");
        return;
      }

      // Build employee data from first (most recent) participant
      const firstP = participants[0] as any;
      setEmployee({
        email: employeeEmail,
        full_name: firstP.full_name || "",
        department: firstP.department,
        job_title: firstP.job_title,
        employee_code: firstP.employee_code,
        first_seen: participants.reduce((earliest: string | null, p: any) => {
          const date = p.started_at || p.completed_at;
          if (!date) return earliest;
          if (!earliest) return date;
          return date < earliest ? date : earliest;
        }, null),
        organization_name: org?.name || "Organization",
      });

      // Build assessment history
      const history: AssessmentHistory[] = (participants as any[]).map((p) => ({
        id: p.id,
        assessment_id: p.assessment_groups?.assessments?.id,
        assessment_title: p.assessment_groups?.assessments?.title || "Unknown Assessment",
        assessment_type: p.assessment_groups?.assessments?.type || "unknown",
        group_name: p.assessment_groups?.name || "Unknown Group",
        status: p.status,
        started_at: p.started_at,
        completed_at: p.completed_at,
        score_summary: p.score_summary,
        ai_report_text: p.ai_report_text,
      }));

      setAssessments(history);
      calculateStats(history);
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (history: AssessmentHistory[]) => {
    const total = history.length;
    const completed = history.filter((a) => a.status === "completed").length;
    const inProgress = history.filter((a) => a.status === "started").length;

    const completedWithScores = history.filter(
      (a) => a.status === "completed" && a.score_summary?.percentage !== undefined
    );

    const scores = completedWithScores.map((a) => a.score_summary.percentage);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const highestScore = scores.length > 0 ? Math.max(...scores) : null;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : null;

    // Calculate scores by type
    const typeScores: Record<string, number[]> = {};
    completedWithScores.forEach((a) => {
      const type = a.assessment_type;
      if (!typeScores[type]) typeScores[type] = [];
      typeScores[type].push(a.score_summary.percentage);
    });

    const scoresByType = Object.entries(typeScores).map(([type, scores]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    // Calculate trait averages for personality assessments
    const traitScores: Record<string, number[]> = {};
    history.forEach((a) => {
      if (a.status === "completed" && a.score_summary?.traits) {
        Object.entries(a.score_summary.traits).forEach(([trait, score]) => {
          if (typeof score === "number") {
            if (!traitScores[trait]) traitScores[trait] = [];
            traitScores[trait].push(score);
          }
        });
      }
    });

    const traitAverages = Object.entries(traitScores).map(([trait, scores]) => ({
      trait: trait.charAt(0).toUpperCase() + trait.slice(1),
      score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      fullMark: 5,
    }));

    setStats({
      totalAssessments: total,
      completed,
      inProgress,
      averageScore,
      highestScore,
      lowestScore,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      scoresByType,
      traitAverages,
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  const handleExportPDF = (assessment: AssessmentHistory) => {
    if (!employee) return;
    generateParticipantPDF({
      participantName: employee.full_name,
      participantEmail: employee.email,
      groupName: assessment.group_name,
      assessmentTitle: assessment.assessment_title,
      assessmentType: assessment.assessment_type,
      completedAt: assessment.completed_at,
      scoreSummary: assessment.score_summary,
      aiReport: assessment.ai_report_text,
      organizationName: employee.organization_name,
    });
    toast.success("PDF exported successfully");
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout activeItem="Employees">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employee || !stats) {
    return null;
  }

  return (
    <DashboardLayout activeItem="Employees">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground"
            >
              {employee.full_name || "Employee Profile"}
            </motion.h1>
            <p className="text-muted-foreground">{employee.email}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assessments</p>
                    <p className="text-3xl font-bold">{stats.totalAssessments}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-l-4 border-l-success">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-3xl font-bold">{stats.completionRate}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.completed} of {stats.totalAssessments} completed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-l-4 border-l-accent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-3xl font-bold">
                      {stats.averageScore !== null ? `${stats.averageScore}%` : "-"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-l-4 border-l-warning">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Best Score</p>
                    <p className="text-3xl font-bold">
                      {stats.highestScore !== null ? `${stats.highestScore}%` : "-"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl text-center">{employee.full_name || "Unknown"}</CardTitle>
              <CardDescription className="text-center">{employee.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.employee_code && (
                <div className="flex items-center gap-3 text-sm">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Employee Code:</span>
                  <span className="font-medium">{employee.employee_code}</span>
                </div>
              )}
              {employee.department && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{employee.department}</span>
                </div>
              )}
              {employee.job_title && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Job Title:</span>
                  <span className="font-medium">{employee.job_title}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">First Assessment:</span>
                <span className="font-medium">{formatDate(employee.first_seen)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Performance Charts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="scores" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="scores">Scores by Type</TabsTrigger>
                  {stats.traitAverages.length > 0 && <TabsTrigger value="traits">Trait Profile</TabsTrigger>}
                </TabsList>

                <TabsContent value="scores">
                  {stats.scoresByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.scoresByType}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="type" className="text-xs" />
                        <YAxis domain={[0, 100]} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}%`, "Score"]}
                        />
                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No graded assessments completed yet
                    </div>
                  )}
                </TabsContent>

                {stats.traitAverages.length > 0 && (
                  <TabsContent value="traits">
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={stats.traitAverages}>
                        <PolarGrid className="stroke-border" />
                        <PolarAngleAxis dataKey="trait" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Assessment History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Assessment History
            </CardTitle>
            <CardDescription>All assessments this employee has participated in</CardDescription>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No assessments found</div>
            ) : (
              <div className="space-y-3">
                {assessments.map((assessment, index) => {
                  const TypeIcon = getTypeIcon(assessment.assessment_type);
                  const statusConfig = getStatusConfig(assessment.status);
                  const StatusIcon = statusConfig.icon;
                  const isGraded = assessment.score_summary?.percentage !== undefined;

                  return (
                    <motion.div
                      key={assessment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-6 h-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{assessment.assessment_title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{assessment.group_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {assessment.assessment_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(assessment.completed_at || assessment.started_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {assessment.status === "completed" && isGraded && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {assessment.score_summary.percentage}%
                            </div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                        )}

                        {assessment.ai_report_text && (
                          <Badge variant="outline" className="gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </Badge>
                        )}

                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig.bg}`}>
                          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                          <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>

                        {assessment.status === "completed" && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedReport(assessment)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleExportPDF(assessment)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedReport?.assessment_title}
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.group_name} • Completed {formatDateTime(selectedReport?.completed_at || null)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Score Summary */}
            {selectedReport?.score_summary && (
              <div>
                <h3 className="font-semibold mb-3">Results</h3>
                {selectedReport.score_summary.percentage !== undefined ? (
                  <div className="text-center p-6 bg-muted rounded-xl">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {selectedReport.score_summary.percentage}%
                    </div>
                    <p className="text-muted-foreground">
                      {selectedReport.score_summary.correctCount} of {selectedReport.score_summary.totalPossible}{" "}
                      correct
                    </p>
                    {selectedReport.score_summary.grade && (
                      <Badge className="mt-3" variant="secondary">
                        Grade: {selectedReport.score_summary.grade}
                      </Badge>
                    )}
                  </div>
                ) : selectedReport.score_summary.traits ? (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                    {Object.entries(selectedReport.score_summary.traits).map(([trait, score]: [string, any]) => (
                      <div key={trait} className="flex items-center justify-between gap-4">
                        <span className="capitalize font-medium">{trait}</span>
                        <div className="flex items-center gap-3 flex-1 max-w-xs">
                          <Progress value={(score / 5) * 100} className="h-2" />
                          <span className="text-sm font-semibold w-10 text-right">{score.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(selectedReport.score_summary, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* AI Report */}
            {selectedReport?.ai_report_text && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI-Generated Feedback
                </h3>
                <div className="prose prose-sm max-w-none bg-gradient-to-br from-primary/5 to-accent/5 p-5 rounded-xl border border-primary/10">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {selectedReport.ai_report_text}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Close
            </Button>
            {selectedReport && (
              <Button onClick={() => handleExportPDF(selectedReport)}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EmployeeDetail;
