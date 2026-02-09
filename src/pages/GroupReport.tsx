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
import { autoDir, autoAlign } from "@/lib/textDirection";
import { getGradeFullLabel, getGradeWithAbbreviation } from "@/lib/gradeLabels";
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
  competencyAverages: { competency: string; percentage: number; grade: string }[] | null;
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
  const [recalculateLoading, setRecalculateLoading] = useState(false);

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
    let competencyAverages: { competency: string; percentage: number; grade: string }[] | null = null;

    // Helper function to get grade
    const getGrade = (percentage: number): string => {
      if (percentage >= 90) return "A";
      if (percentage >= 80) return "B";
      if (percentage >= 70) return "C";
      if (percentage >= 60) return "D";
      return "F";
    };

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

      // Calculate competency averages for SJT assessments
      const competencyData: Record<string, { totalPercentage: number; count: number }> = {};
      
      completedWithScores.forEach((p) => {
        const breakdown = p.score_summary?.competencyBreakdown;
        if (breakdown && typeof breakdown === "object") {
          Object.entries(breakdown).forEach(([competency, data]: [string, any]) => {
            if (typeof data?.percentage === "number") {
              if (!competencyData[competency]) {
                competencyData[competency] = { totalPercentage: 0, count: 0 };
              }
              competencyData[competency].totalPercentage += data.percentage;
              competencyData[competency].count += 1;
            }
          });
        }
      });

      if (Object.keys(competencyData).length > 0) {
        competencyAverages = Object.entries(competencyData).map(([competency, data]) => {
          const avgPercentage = Math.round(data.totalPercentage / data.count);
          return {
            competency,
            percentage: avgPercentage,
            grade: getGrade(avgPercentage),
          };
        });
      }
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
      competencyAverages,
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

  const handleRecalculateScores = async () => {
    if (!groupId) return;
    
    setRecalculateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recalculate-sjt-scores", {
        body: { groupId },
      });

      if (error) throw error;

      if (data.recalculatedCount > 0) {
        toast.success(`Recalculated scores for ${data.recalculatedCount} participant(s)`);
        // Refresh the data
        fetchGroupData();
      } else {
        toast.info("No SJT assessments found to recalculate");
      }
    } catch (error: any) {
      console.error("Error recalculating scores:", error);
      toast.error("Failed to recalculate scores");
    } finally {
      setRecalculateLoading(false);
    }
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
          <Button 
            variant="outline" 
            onClick={handleRecalculateScores} 
            disabled={recalculateLoading || participants.filter(p => p.status === 'completed').length === 0}
          >
            {recalculateLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Recalculate Scores
          </Button>
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

        {/* Stats Cards with Circular Progress */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-0 shadow-md overflow-hidden">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Participants</p>
                    <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.totalParticipants}</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-0 shadow-md overflow-hidden">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Completion Rate</p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                      {stats.completed} / {stats.totalParticipants}
                    </p>
                  </div>
                  <div className="relative">
                    <svg width="70" height="70" className="-rotate-90">
                      <circle cx="35" cy="35" r="28" fill="none" strokeWidth="7" className="stroke-emerald-200 dark:stroke-emerald-800/50" />
                      <circle
                        cx="35" cy="35" r="28" fill="none" strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - stats.completionRate / 100)}
                        className="stroke-emerald-500 transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {stats.completionRate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/20 border-0 shadow-md overflow-hidden">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Average Score</p>
                    <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-1">
                      Group Performance
                    </p>
                  </div>
                  <div className="relative">
                    <svg width="70" height="70" className="-rotate-90">
                      <defs>
                        <linearGradient id="groupAvgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <circle cx="35" cy="35" r="28" fill="none" strokeWidth="7" className="stroke-violet-200 dark:stroke-violet-800/50" />
                      <circle
                        cx="35" cy="35" r="28" fill="none" strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={stats.averageScore !== null ? 2 * Math.PI * 28 * (1 - stats.averageScore / 100) : 2 * Math.PI * 28}
                        stroke="url(#groupAvgGradient)"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-violet-700 dark:text-violet-300">
                      {stats.averageScore !== null ? `${stats.averageScore}%` : "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="h-full bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-0 shadow-md overflow-hidden">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Highest Score</p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                      Top Performer
                    </p>
                  </div>
                  <div className="relative">
                    <svg width="70" height="70" className="-rotate-90">
                      <defs>
                        <linearGradient id="groupHighGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                      <circle cx="35" cy="35" r="28" fill="none" strokeWidth="7" className="stroke-amber-200 dark:stroke-amber-800/50" />
                      <circle
                        cx="35" cy="35" r="28" fill="none" strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={stats.highestScore !== null ? 2 * Math.PI * 28 * (1 - stats.highestScore / 100) : 2 * Math.PI * 28}
                        stroke="url(#groupHighGradient)"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-700 dark:text-amber-300">
                      {stats.highestScore !== null ? `${stats.highestScore}%` : "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants ({stats.totalParticipants})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
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
              </motion.div>

              {/* Grade Distribution or Trait Averages */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              {group.assessment?.is_graded && stats.gradeDistribution.length > 0 ? (
                <Card className="h-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
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
                        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : stats.traitAverages && stats.traitAverages.length > 0 ? (
                <Card className="h-full bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/20 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
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
                        <Bar dataKey="average" fill="#a855f7" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
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
              </motion.div>
            </div>

            {/* Competency Breakdown for SJT */}
            {stats.competencyAverages && stats.competencyAverages.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }}>
                <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      Competency Breakdown
                    </CardTitle>
                    <CardDescription>Average performance by competency across all participants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.competencyAverages.map((item, index) => (
                        <motion.div
                          key={item.competency}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className="p-4 bg-card rounded-xl border shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-foreground text-sm">{item.competency}</span>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                              item.grade === 'A' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              item.grade === 'B' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              item.grade === 'C' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              item.grade === 'D' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {item.grade}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={item.percentage} className="h-2 flex-1" />
                            <span className="text-sm font-semibold text-muted-foreground w-12 text-right">
                              {item.percentage}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {getGradeFullLabel(item.grade)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* AI Group Narrative */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950/30 dark:via-fuchsia-950/20 dark:to-pink-950/20 border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
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
                  <div
                    dir={autoDir(groupNarrative)}
                    className="prose prose-sm max-w-none bg-gradient-to-br from-primary/5 to-accent/5 p-5 rounded-xl border border-primary/10"
                    style={{ textAlign: autoAlign(groupNarrative), unicodeBidi: "plaintext" }}
                  >
                    {groupNarrative.split("\n\n").map((para, idx) => (
                      <p
                        key={idx}
                        dir={autoDir(para)}
                        className="text-foreground leading-relaxed mb-2"
                        style={{ textAlign: autoAlign(para), unicodeBidi: "plaintext" }}
                      >
                        {para}
                      </p>
                    ))}
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
            </motion.div>

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
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-muted rounded-xl">
                      <div className="text-5xl font-bold text-primary mb-2">
                        {selectedParticipant.score_summary.percentage}%
                      </div>
                      {selectedParticipant.score_summary.grade && (
                        <Badge className="mt-3 text-base px-4 py-1" variant="secondary">
                          {getGradeFullLabel(selectedParticipant.score_summary.grade)}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Competency Breakdown for SJT */}
                    {selectedParticipant.score_summary.competencyBreakdown && 
                     Object.keys(selectedParticipant.score_summary.competencyBreakdown).length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm text-muted-foreground mb-3">Competency Breakdown</h4>
                        <div className="space-y-3">
                          {Object.entries(selectedParticipant.score_summary.competencyBreakdown).map(
                            ([competency, data]: [string, any]) => (
                              <div key={competency} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                  <span className="font-medium text-sm">{competency}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getGradeWithAbbreviation(data.grade)} ({data.percentage}%)
                                  </Badge>
                                </div>
                                <Progress value={data.percentage} className="h-2" />
                              </div>
                            )
                          )}
                        </div>
                      </div>
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
                <div
                  dir={autoDir(selectedParticipant.ai_report_text)}
                  className="rounded-xl border border-border/50 bg-card/50 p-5"
                  style={{
                    textAlign: autoAlign(selectedParticipant.ai_report_text),
                    unicodeBidi: "plaintext",
                  }}
                >
                  {selectedParticipant.ai_report_text.split("\n\n").map((para, idx) => (
                    <p
                      key={idx}
                      dir={autoDir(para)}
                      className="whitespace-pre-wrap text-foreground leading-relaxed mb-2"
                      style={{ textAlign: autoAlign(para), unicodeBidi: "plaintext" }}
                    >
                      {para}
                    </p>
                  ))}
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
