import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCsvExport } from "@/hooks/useCsvExport";
import { useLanguage } from "@/i18n/LanguageContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Play,
  TrendingUp,
  Award,
  BarChart3,
  User,
  Eye,
  FileText,
  Loader2,
  Brain,
  Sparkles,
  Download,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { openGroupPrintPreview, openParticipantPrintPreview } from "@/lib/printPreview";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface GroupData {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  organization_id: string;
  assessment: {
    id: string;
    title: string;
    type: string;
    is_graded: boolean | null;
  } | null;
}

interface OrganizationData {
  id: string;
  name: string;
  primary_language: string | null;
  logo_url: string | null;
  primary_color: string | null;
}

interface ParticipantData {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_code: string | null;
  department: string | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  score_summary: any;
  ai_report_text: string | null;
}

interface GroupStats {
  totalParticipants: number;
  completed: number;
  inProgress: number;
  invited: number;
  completionRate: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  gradeDistribution: { grade: string; count: number }[];
  traitAverages: { trait: string; average: number }[] | null;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const STATUS_COLORS = {
  completed: "hsl(var(--success))",
  started: "hsl(var(--warning))",
  invited: "hsl(var(--muted-foreground))",
};

const GroupReport = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { exportToCsv } = useCsvExport();
  const { t, dir } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantData | null>(null);
  const [groupNarrative, setGroupNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  useEffect(() => {
    if (groupId && user) {
      fetchGroupData();
    }
  }, [groupId, user]);

  const fetchGroupData = async () => {
    setLoading(true);
    try {
      // Fetch group with assessment
      const { data: groupData, error: groupError } = await supabase
        .from("assessment_groups")
        .select(`
          id, name, start_date, end_date, is_active, organization_id,
          assessment:assessments(id, title, type, is_graded)
        `)
        .eq("id", groupId)
        .maybeSingle();

      if (groupError) throw groupError;
      if (!groupData) {
        toast.error("Group not found");
        navigate("/assessment-groups");
        return;
      }

      setGroup(groupData as GroupData);

      // Fetch organization details
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, primary_language, logo_url, primary_color")
        .eq("id", groupData.organization_id)
        .maybeSingle();

      if (orgData) {
        setOrganization(orgData);
      }

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select("*")
        .eq("group_id", groupId)
        .order("completed_at", { ascending: false, nullsFirst: false });

      if (participantsError) throw participantsError;

      const participantsList = participantsData || [];
      setParticipants(participantsList);

      // Calculate statistics
      calculateStats(participantsList, groupData.assessment?.is_graded);
    } catch (error) {
      console.error("Error fetching group data:", error);
      toast.error("Failed to load group data");
    } finally {
      setLoading(false);
    }
  };

  const generateNarrative = async () => {
    if (!groupId || narrativeLoading) return;
    
    setNarrativeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-group-narrative", {
        body: { groupId }
      });

      if (error) throw error;

      if (data?.narrative) {
        setGroupNarrative(data.narrative);
        toast.success("AI narrative generated");
      }
    } catch (error: any) {
      console.error("Error generating narrative:", error);
      if (error?.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error?.message?.includes("402")) {
        toast.error("AI credits exhausted. Please add credits.");
      } else {
        toast.error("Failed to generate narrative");
      }
    } finally {
      setNarrativeLoading(false);
    }
  };

  const calculateStats = (participantsList: ParticipantData[], isGraded: boolean | null | undefined) => {
    const total = participantsList.length;
    const completed = participantsList.filter((p) => p.status === "completed").length;
    const inProgress = participantsList.filter((p) => p.status === "started").length;
    const invited = participantsList.filter((p) => p.status === "invited").length;

    const completedWithScores = participantsList.filter(
      (p) => p.status === "completed" && p.score_summary
    );

    let averageScore: number | null = null;
    let highestScore: number | null = null;
    let lowestScore: number | null = null;
    let gradeDistribution: { grade: string; count: number }[] = [];
    let traitAverages: { trait: string; average: number }[] | null = null;

    if (isGraded && completedWithScores.length > 0) {
      // Calculate score stats for graded assessments
      const scores = completedWithScores
        .map((p) => p.score_summary?.percentage)
        .filter((s): s is number => typeof s === "number");

      if (scores.length > 0) {
        averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        highestScore = Math.max(...scores);
        lowestScore = Math.min(...scores);
      }

      // Calculate grade distribution
      const grades = completedWithScores
        .map((p) => p.score_summary?.grade)
        .filter((g): g is string => typeof g === "string");

      const gradeCount: Record<string, number> = {};
      grades.forEach((g) => {
        gradeCount[g] = (gradeCount[g] || 0) + 1;
      });

      gradeDistribution = ["A", "B", "C", "D", "F"]
        .filter((g) => gradeCount[g])
        .map((g) => ({ grade: g, count: gradeCount[g] || 0 }));
    } else if (!isGraded && completedWithScores.length > 0) {
      // Calculate trait averages for personality/trait-based assessments
      const allTraits: Record<string, number[]> = {};
      
      completedWithScores.forEach((p) => {
        const traits = p.score_summary?.traits;
        if (traits && typeof traits === "object") {
          Object.entries(traits).forEach(([trait, score]) => {
            if (typeof score === "number") {
              if (!allTraits[trait]) allTraits[trait] = [];
              allTraits[trait].push(score);
            }
          });
        }
      });

      if (Object.keys(allTraits).length > 0) {
        traitAverages = Object.entries(allTraits).map(([trait, scores]) => ({
          trait: trait.charAt(0).toUpperCase() + trait.slice(1),
          average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
        }));
      }
    }

    setStats({
      totalParticipants: total,
      completed,
      inProgress,
      invited,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      averageScore,
      highestScore,
      lowestScore,
      gradeDistribution,
      traitAverages,
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy HH:mm");
  };

  const handleExportGroupPDF = () => {
    if (!group || !stats) return;
    const lang = (organization?.primary_language || 'en') as 'en' | 'ar';
    
    openGroupPrintPreview(
      {
        groupName: group.name,
        assessmentTitle: group.assessment?.title || "Unknown",
        assessmentType: group.assessment?.type || "unknown",
        startDate: group.start_date,
        endDate: group.end_date,
        stats: {
          totalParticipants: stats.totalParticipants,
          completed: stats.completed,
          inProgress: stats.inProgress,
          invited: stats.invited,
          completionRate: stats.completionRate,
          averageScore: stats.averageScore,
          highestScore: stats.highestScore,
          lowestScore: stats.lowestScore,
        },
        aiNarrative: groupNarrative || undefined,
      },
      {
        name: organization?.name || "Organization",
        logoUrl: organization?.logo_url,
        primaryColor: organization?.primary_color,
      },
      lang
    );
  };

  const handleExportParticipantPDF = (participant: ParticipantData) => {
    if (!group) return;
    const lang = (organization?.primary_language || 'en') as 'en' | 'ar';
    
    openParticipantPrintPreview(
      {
        participantName: participant.full_name || "",
        participantEmail: participant.email || "",
        employeeCode: participant.employee_code || undefined,
        department: participant.department || undefined,
        groupName: group.name,
        assessmentTitle: group.assessment?.title || "Unknown",
        assessmentType: group.assessment?.type || "unknown",
        completedAt: participant.completed_at,
        scoreSummary: participant.score_summary,
        aiReport: participant.ai_report_text,
      },
      {
        name: organization?.name || "Organization",
        logoUrl: organization?.logo_url,
        primaryColor: organization?.primary_color,
      },
      lang
    );
  };

  const handleExportResultsCsv = () => {
    if (!group || participants.length === 0) return;

    const isGraded = group.assessment?.is_graded;
    
    // Build headers dynamically based on assessment type
    const baseHeaders = ['Employee Code', 'Full Name', 'Email', 'Department', 'Status', 'Started At', 'Completed At'];
    const scoreHeaders = isGraded 
      ? ['Score (%)', 'Correct Answers', 'Total Questions', 'Grade']
      : ['Traits Summary'];
    
    const headers = [...baseHeaders, ...scoreHeaders];

    // Transform participants to include score data
    const dataWithScores = participants.map(p => {
      const base = {
        employee_code: p.employee_code || '',
        full_name: p.full_name || '',
        email: p.email || '',
        department: p.department || '',
        status: p.status || 'invited',
        started_at: p.started_at ? format(new Date(p.started_at), 'yyyy-MM-dd HH:mm') : '',
        completed_at: p.completed_at ? format(new Date(p.completed_at), 'yyyy-MM-dd HH:mm') : '',
      };

      if (isGraded) {
        return {
          ...base,
          score_percentage: p.score_summary?.percentage ?? '',
          correct_answers: p.score_summary?.correct ?? '',
          total_questions: p.score_summary?.total ?? '',
          grade: p.score_summary?.grade ?? '',
        };
      } else {
        // Format traits as a string summary
        const traits = p.score_summary?.traits;
        const traitsSummary = traits 
          ? Object.entries(traits).map(([k, v]) => `${k}: ${v}`).join('; ')
          : '';
        return {
          ...base,
          traits_summary: traitsSummary,
        };
      }
    });

    const columnMap: Record<string, string> = {
      'Employee Code': 'employee_code',
      'Full Name': 'full_name',
      'Email': 'email',
      'Department': 'department',
      'Status': 'status',
      'Started At': 'started_at',
      'Completed At': 'completed_at',
    };

    if (isGraded) {
      columnMap['Score (%)'] = 'score_percentage';
      columnMap['Correct Answers'] = 'correct_answers';
      columnMap['Total Questions'] = 'total_questions';
      columnMap['Grade'] = 'grade';
    } else {
      columnMap['Traits Summary'] = 'traits_summary';
    }

    exportToCsv({
      filename: `${group.name.replace(/\s+/g, '_')}_results`,
      headers,
      data: dataWithScores,
      columnMap,
    });

    toast.success("Results exported to CSV");
  };

  const statusData = stats
    ? [
        { name: "Completed", value: stats.completed, color: STATUS_COLORS.completed },
        { name: "In Progress", value: stats.inProgress, color: STATUS_COLORS.started },
        { name: "Invited", value: stats.invited, color: STATUS_COLORS.invited },
      ].filter((d) => d.value > 0)
    : [];

  if (authLoading || loading) {
    return (
      <DashboardLayout activeItem="Assessment Groups">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!group || !stats) {
    return null;
  }

  return (
    <DashboardLayout activeItem="Assessment Groups">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/assessment-groups")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground"
            >
              {group.name}
            </motion.h1>
            <p className="text-muted-foreground">
              {group.assessment?.title || "No assessment assigned"} •{" "}
              {formatDate(group.start_date)} - {formatDate(group.end_date)}
            </p>
          </div>
          <Button variant="outline" onClick={handleExportResultsCsv} disabled={participants.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportGroupPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Badge variant={group.is_active ? "default" : "secondary"}>
            {group.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                    <p className="text-sm text-muted-foreground">Total Participants</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completionRate}%</p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {stats.averageScore !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.averageScore}%</p>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {stats.highestScore !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Award className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.highestScore}%</p>
                      <p className="text-sm text-muted-foreground">Highest Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants ({stats.totalParticipants})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No participants yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Grade Distribution or Trait Averages */}
              {group.assessment?.is_graded && stats.gradeDistribution.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="w-5 h-5" />
                      Grade Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.gradeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="grade" className="text-xs" />
                        <YAxis allowDecimals={false} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : stats.traitAverages && stats.traitAverages.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Brain className="w-5 h-5" />
                      Trait Averages
                    </CardTitle>
                    <CardDescription>Average scores across all completed assessments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.traitAverages} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" domain={[0, 5]} className="text-xs" />
                        <YAxis dataKey="trait" type="category" width={100} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="average" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="w-5 h-5" />
                      Score Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      {stats.completed === 0
                        ? "No completed assessments yet"
                        : "Score data not available"}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* AI Group Narrative */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Analysis & Insights
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateNarrative}
                    disabled={narrativeLoading || stats.completed === 0}
                  >
                    {narrativeLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : groupNarrative ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Generate Analysis
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  AI-powered analysis of group performance and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {groupNarrative ? (
                  <div className="prose prose-sm max-w-none bg-gradient-to-br from-primary/5 to-accent/5 p-5 rounded-xl border border-primary/10">
                    <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {groupNarrative}
                    </p>
                  </div>
                ) : stats.completed === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No completed assessments yet.</p>
                    <p className="text-sm">AI analysis will be available once participants complete the assessment.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Generate Analysis" to create an AI-powered report</p>
                    <p className="text-sm mt-1">This will analyze all {stats.completed} completed assessments</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Range Summary */}
            {stats.averageScore !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Score Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold text-destructive">{stats.lowestScore}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Lowest Score</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary/10">
                      <p className="text-3xl font-bold text-primary">{stats.averageScore}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Average Score</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-success/10">
                      <p className="text-3xl font-bold text-success">{stats.highestScore}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Highest Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>All Participants</CardTitle>
                <CardDescription>View individual results and AI-generated feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No participants in this group yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant, index) => {
                      const isCompleted = participant.status === "completed";
                      const hasScore = participant.score_summary?.percentage !== undefined;
                      const hasTraits = participant.score_summary?.traits;
                      const hasAIReport = !!participant.ai_report_text;

                      return (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {participant.full_name || participant.email || "Anonymous"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {participant.email || participant.employee_code || "-"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            {isCompleted && hasScore && (
                              <div className="text-center">
                                <p className="text-xl font-bold text-primary">
                                  {participant.score_summary.percentage}%
                                </p>
                                <p className="text-xs text-muted-foreground">Score</p>
                              </div>
                            )}

                            {hasAIReport && (
                              <Badge variant="outline" className="gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI Report
                              </Badge>
                            )}

                            <Badge
                              variant={
                                participant.status === "completed"
                                  ? "default"
                                  : participant.status === "started"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {participant.status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {participant.status === "started" && <Play className="w-3 h-3 mr-1" />}
                              {participant.status === "invited" && <Clock className="w-3 h-3 mr-1" />}
                              {participant.status?.charAt(0).toUpperCase() + participant.status?.slice(1)}
                            </Badge>

                            {isCompleted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedParticipant(participant)}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Participant Report Dialog */}
      <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedParticipant?.full_name || selectedParticipant?.email || "Participant Report"}
            </DialogTitle>
            <DialogDescription>
              Completed {formatDateTime(selectedParticipant?.completed_at || null)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Score Summary */}
            {selectedParticipant?.score_summary && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Results
                </h3>
                {selectedParticipant.score_summary.percentage !== undefined ? (
                  <div className="text-center p-6 bg-muted rounded-xl">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {selectedParticipant.score_summary.percentage}%
                    </div>
                    <p className="text-muted-foreground">
                      {selectedParticipant.score_summary.correctCount} of{" "}
                      {selectedParticipant.score_summary.totalPossible} correct
                    </p>
                    {selectedParticipant.score_summary.grade && (
                      <Badge className="mt-3" variant="secondary">
                        Grade: {selectedParticipant.score_summary.grade}
                      </Badge>
                    )}
                  </div>
                ) : selectedParticipant.score_summary.traits ? (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                    {Object.entries(selectedParticipant.score_summary.traits).map(
                      ([trait, score]: [string, any]) => (
                        <div key={trait} className="flex items-center justify-between gap-4">
                          <span className="capitalize font-medium">{trait}</span>
                          <div className="flex items-center gap-3 flex-1 max-w-xs">
                            <Progress value={(score / 5) * 100} className="h-2" />
                            <span className="text-sm font-semibold w-10 text-right">
                              {score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(selectedParticipant.score_summary, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* AI Report */}
            {selectedParticipant?.ai_report_text && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI-Generated Feedback
                </h3>
                <div className="prose prose-sm max-w-none bg-gradient-to-br from-primary/5 to-accent/5 p-5 rounded-xl border border-primary/10">
                  <p
                    dir={dir}
                    className={`whitespace-pre-wrap text-foreground leading-relaxed bidi-plaintext ${dir === "rtl" ? "text-right" : "text-left"}`}
                  >
                    {selectedParticipant.ai_report_text}
                  </p>
                </div>
              </div>
            )}

            {!selectedParticipant?.score_summary && !selectedParticipant?.ai_report_text && (
              <div className="text-center py-8 text-muted-foreground">
                No detailed results available
              </div>
            )}

            {/* Export PDF Button */}
            {selectedParticipant && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={() => handleExportParticipantPDF(selectedParticipant)}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Report
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GroupReport;
