import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
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
} from "lucide-react";

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
        .order("created_at", { ascending: false });

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
        first_seen: firstP.started_at || firstP.completed_at,
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
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const completedCount = assessments.filter((a) => a.status === "completed").length;
  const totalCount = assessments.length;

  if (authLoading || loading) {
    return (
      <DashboardLayout activeItem="Employees">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
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
              Employee Profile
            </motion.h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">{employee.full_name || "Unknown"}</CardTitle>
              <CardDescription>{employee.email}</CardDescription>
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

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">{completedCount} / {totalCount}</span>
                </div>
                <Progress value={(completedCount / totalCount) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Assessment History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Assessment History
              </CardTitle>
              <CardDescription>
                All assessments this employee has participated in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assessments found
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment, index) => {
                    const TypeIcon = getTypeIcon(assessment.assessment_type);
                    const statusConfig = getStatusConfig(assessment.status);
                    const StatusIcon = statusConfig.icon;
                    const isGraded = assessment.score_summary?.percentage !== undefined;

                    return (
                      <motion.div
                        key={assessment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-6 h-6 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{assessment.assessment_title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {assessment.group_name}
                          </p>
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

                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig.bg}`}>
                            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                            <span className={`text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          {assessment.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReport(assessment)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
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
      </div>

      {/* Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.assessment_title}</DialogTitle>
            <DialogDescription>
              {selectedReport?.group_name} • Completed {formatDate(selectedReport?.completed_at || null)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Score Summary */}
            {selectedReport?.score_summary && (
              <div>
                <h3 className="font-semibold mb-3">Results</h3>
                {selectedReport.score_summary.percentage !== undefined ? (
                  <div className="text-center p-6 bg-muted rounded-lg">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {selectedReport.score_summary.percentage}%
                    </div>
                    <p className="text-muted-foreground">
                      {selectedReport.score_summary.correctCount} of {selectedReport.score_summary.totalPossible} correct
                    </p>
                    <Badge className="mt-2">Grade: {selectedReport.score_summary.grade}</Badge>
                  </div>
                ) : selectedReport.score_summary.traits ? (
                  <div className="space-y-3">
                    {Object.entries(selectedReport.score_summary.traits).map(([trait, score]: [string, any]) => (
                      <div key={trait} className="flex items-center justify-between">
                        <span className="capitalize">{trait}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(score / 5) * 100} className="w-32 h-2" />
                          <span className="text-sm font-medium w-8">{score.toFixed(1)}</span>
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
                <h3 className="font-semibold mb-3">AI-Generated Feedback</h3>
                <div className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedReport.ai_report_text}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EmployeeDetail;
