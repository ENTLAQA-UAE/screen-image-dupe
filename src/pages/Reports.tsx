import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCsvExport } from "@/hooks/useCsvExport";
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  BarChart3,
  FileText,
  Loader2,
  ArrowRight,
  Building2,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  Eye,
  Download,
  PieChart,
  Activity,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

interface OrgStats {
  totalAssessments: number;
  activeGroups: number;
  totalParticipants: number;
  completedParticipants: number;
  averageCompletionRate: number;
  averageScore: number | null;
}

interface GroupSummary {
  id: string;
  name: string;
  assessmentTitle: string;
  assessmentType: string;
  totalParticipants: number;
  completed: number;
  completionRate: number;
  averageScore: number | null;
}

interface AssessmentTypeStats {
  type: string;
  count: number;
  completed: number;
}

interface TrendData {
  date: string;
  completions: number;
}

interface EmployeeSummary {
  email: string;
  fullName: string;
  assessmentsCompleted: number;
  averageScore: number | null;
  lastCompleted: string | null;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const getTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "cognitive": return Brain;
    case "personality": return Heart;
    case "situational": return MessageSquare;
    case "language": return Languages;
    default: return FileText;
  }
};

const Reports = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>("");
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [typeStats, setTypeStats] = useState<AssessmentTypeStats[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [topEmployees, setTopEmployees] = useState<EmployeeSummary[]>([]);
  const [allResults, setAllResults] = useState<any[]>([]);

  const { exportToCsv } = useCsvExport();

  useEffect(() => {
    if (!authLoading && isSuperAdmin()) {
      navigate("/super-admin", { replace: true });
    }
  }, [authLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    if (user) fetchOrganization();
  }, [user]);

  useEffect(() => {
    if (organizationId) fetchAllData();
  }, [organizationId]);

  const fetchOrganization = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user!.id)
      .maybeSingle();

    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id);

      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profile.organization_id)
        .maybeSingle();

      setOrgName(org?.name || "Organization");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrgStats(),
        fetchGroupSummaries(),
        fetchTypeStats(),
        fetchTrendData(),
        fetchTopEmployees(),
        fetchAllResults(),
      ]);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgStats = async () => {
    // Fetch assessments count
    const { count: assessmentsCount } = await supabase
      .from("assessments")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId!);

    // Fetch active groups count
    const { count: activeGroupsCount } = await supabase
      .from("assessment_groups")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId!)
      .eq("is_active", true);

    // Fetch participants
    const { data: participants } = await supabase
      .from("participants")
      .select("status, score_summary")
      .eq("organization_id", organizationId!);

    const total = participants?.length || 0;
    const completed = participants?.filter((p) => p.status === "completed").length || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate average score
    const scores = participants
      ?.filter((p) => p.status === "completed" && p.score_summary && typeof p.score_summary === "object" && "percentage" in p.score_summary)
      .map((p) => (p.score_summary as { percentage: number }).percentage) || [];
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    setStats({
      totalAssessments: assessmentsCount || 0,
      activeGroups: activeGroupsCount || 0,
      totalParticipants: total,
      completedParticipants: completed,
      averageCompletionRate: completionRate,
      averageScore: avgScore,
    });
  };

  const fetchGroupSummaries = async () => {
    const { data: groupsData } = await supabase
      .from("assessment_groups")
      .select(`
        id, name,
        assessment:assessments(title, type, is_graded)
      `)
      .eq("organization_id", organizationId!)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!groupsData) return;

    const summaries = await Promise.all(
      groupsData.map(async (group: any) => {
        const { data: participants } = await supabase
          .from("participants")
          .select("status, score_summary")
          .eq("group_id", group.id);

        const total = participants?.length || 0;
        const completed = participants?.filter((p) => p.status === "completed").length || 0;
        const scores = participants
          ?.filter((p) => p.status === "completed" && p.score_summary && typeof p.score_summary === "object" && "percentage" in p.score_summary)
          .map((p) => (p.score_summary as { percentage: number }).percentage) || [];
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

        return {
          id: group.id,
          name: group.name,
          assessmentTitle: group.assessment?.title || "No assessment",
          assessmentType: group.assessment?.type || "unknown",
          totalParticipants: total,
          completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          averageScore: avgScore,
        };
      })
    );

    setGroups(summaries);
  };

  const fetchTypeStats = async () => {
    const { data: assessments } = await supabase
      .from("assessments")
      .select("id, type")
      .eq("organization_id", organizationId!);

    if (!assessments) return;

    const typeMap: Record<string, { count: number; completed: number }> = {};

    for (const assessment of assessments) {
      const type = assessment.type || "unknown";
      if (!typeMap[type]) typeMap[type] = { count: 0, completed: 0 };
      typeMap[type].count++;

      // Get completed count for this assessment
      const { count } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .in("group_id", 
          (await supabase
            .from("assessment_groups")
            .select("id")
            .eq("assessment_id", assessment.id))
          .data?.map(g => g.id) || []
        );

      typeMap[type].completed += count || 0;
    }

    setTypeStats(
      Object.entries(typeMap).map(([type, data]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: data.count,
        completed: data.completed,
      }))
    );
  };

  const fetchTrendData = async () => {
    const { data: participants } = await supabase
      .from("participants")
      .select("completed_at")
      .eq("organization_id", organizationId!)
      .eq("status", "completed")
      .gte("completed_at", subDays(new Date(), 30).toISOString())
      .order("completed_at", { ascending: true });

    if (!participants) return;

    // Group by date
    const dateMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "MMM d");
      dateMap[date] = 0;
    }

    participants.forEach((p) => {
      if (p.completed_at) {
        const date = format(new Date(p.completed_at), "MMM d");
        if (dateMap[date] !== undefined) dateMap[date]++;
      }
    });

    setTrendData(Object.entries(dateMap).map(([date, completions]) => ({ date, completions })));
  };

  const fetchTopEmployees = async () => {
    const { data: participants } = await supabase
      .from("participants")
      .select("email, full_name, status, score_summary, completed_at")
      .eq("organization_id", organizationId!)
      .eq("status", "completed")
      .not("email", "is", null);

    if (!participants) return;

    // Group by email
    const employeeMap: Record<string, EmployeeSummary> = {};

    participants.forEach((p) => {
      if (!p.email) return;

      if (!employeeMap[p.email]) {
        employeeMap[p.email] = {
          email: p.email,
          fullName: p.full_name || "",
          assessmentsCompleted: 0,
          averageScore: null,
          lastCompleted: null,
        };
      }

      employeeMap[p.email].assessmentsCompleted++;
      
      if (p.completed_at && (!employeeMap[p.email].lastCompleted || p.completed_at > employeeMap[p.email].lastCompleted!)) {
        employeeMap[p.email].lastCompleted = p.completed_at;
        employeeMap[p.email].fullName = p.full_name || employeeMap[p.email].fullName;
      }

      if (p.score_summary && typeof p.score_summary === "object" && "percentage" in p.score_summary) {
        const percentage = (p.score_summary as { percentage: number }).percentage;
        const current = employeeMap[p.email].averageScore || 0;
        const count = employeeMap[p.email].assessmentsCompleted;
        employeeMap[p.email].averageScore = Math.round((current * (count - 1) + percentage) / count);
      }
    });

    const sorted = Object.values(employeeMap)
      .sort((a, b) => b.assessmentsCompleted - a.assessmentsCompleted)
      .slice(0, 10);

    setTopEmployees(sorted);
  };

  const fetchAllResults = async () => {
    const { data: participants } = await supabase
      .from("participants")
      .select(`
        id, full_name, email, employee_code, department, job_title, status,
        started_at, completed_at, score_summary,
        group:assessment_groups(
          name,
          assessment:assessments(title, type)
        )
      `)
      .eq("organization_id", organizationId!)
      .eq("status", "completed");

    if (participants) {
      setAllResults(participants.map(p => ({
        ...p,
        group_name: (p.group as any)?.name || '',
        assessment_title: (p.group as any)?.assessment?.title || '',
        assessment_type: (p.group as any)?.assessment?.type || '',
        score_percentage: p.score_summary && typeof p.score_summary === 'object' && 'percentage' in p.score_summary 
          ? (p.score_summary as { percentage: number }).percentage 
          : null,
      })));
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout activeItem="Reports">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeItem="Reports">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              {t.reports.title}
            </motion.h1>
            <p className="text-muted-foreground">
              {t.reports.description} - {orgName}
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => exportToCsv({
              filename: 'assessment_results',
              headers: [t.participants.employeeCode, t.participants.name, t.participants.email, t.participants.department, t.participants.jobTitle, t.participants.group, 'Assessment', t.assessments.type, t.participants.score, t.participants.completedAt],
              data: allResults,
              columnMap: {
                [t.participants.employeeCode]: 'employee_code',
                [t.participants.name]: 'full_name',
                [t.participants.email]: 'email',
                [t.participants.department]: 'department',
                [t.participants.jobTitle]: 'job_title',
                [t.participants.group]: 'group_name',
                'Assessment': 'assessment_title',
                [t.assessments.type]: 'assessment_type',
                [t.participants.score]: 'score_percentage',
                [t.participants.completedAt]: 'completed_at',
              }
            })}
            disabled={allResults.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {t.reports.exportExcel}
          </Button>
        </div>

        {/* Overview Stats - Colorful Gradient Cards */}
        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Assessments */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-0 shadow-md overflow-hidden">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t.dashboard.totalAssessments}</p>
                      <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.totalAssessments}</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Completion Rate with Circular Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-0 shadow-md overflow-hidden">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t.dashboard.completionRate}</p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                        {stats.completedParticipants} / {stats.totalParticipants}
                      </p>
                    </div>
                    <div className="relative">
                      <svg width="70" height="70" className="-rotate-90">
                        <circle cx="35" cy="35" r="28" fill="none" strokeWidth="7" className="stroke-emerald-200 dark:stroke-emerald-800/50" />
                        <circle
                          cx="35" cy="35" r="28" fill="none" strokeWidth="7" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - stats.averageCompletionRate / 100)}
                          className="stroke-emerald-500 transition-all duration-700 ease-out"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-emerald-700 dark:text-emerald-300">
                        {stats.averageCompletionRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Groups */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="h-full bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/20 border-0 shadow-md overflow-hidden">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{t.dashboard.activeGroups}</p>
                      <p className="text-4xl font-bold text-violet-700 dark:text-violet-300 mt-1">{stats.activeGroups}</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Average Score with Circular Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="h-full bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-0 shadow-md overflow-hidden">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{t.employees.averageScore}</p>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                        {t.reports.organizationOverview}
                      </p>
                    </div>
                    <div className="relative">
                      <svg width="70" height="70" className="-rotate-90">
                        <defs>
                          <linearGradient id="avgScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#f97316" />
                          </linearGradient>
                        </defs>
                        <circle cx="35" cy="35" r="28" fill="none" strokeWidth="7" className="stroke-amber-200 dark:stroke-amber-800/50" />
                        <circle
                          cx="35" cy="35" r="28" fill="none" strokeWidth="7" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={stats.averageScore !== null ? 2 * Math.PI * 28 * (1 - stats.averageScore / 100) : 2 * Math.PI * 28}
                          stroke="url(#avgScoreGradient)"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-700 dark:text-amber-300">
                        {stats.averageScore !== null ? `${stats.averageScore}%` : "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">{t.reports.organizationOverview}</TabsTrigger>
            <TabsTrigger value="groups">{t.reports.groupAnalytics}</TabsTrigger>
            <TabsTrigger value="employees">{t.reports.employeeReports}</TabsTrigger>
          </TabsList>

          {/* Organization Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Completion Trend */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      {t.reports.completionTrendLast30}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis allowDecimals={false} className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="completions"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorCompletions)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                        {t.reports.noCompletionData}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Assessment Types Distribution */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="h-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-white" />
                      </div>
                      {t.reports.assessmentTypes}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                          <Pie
                            data={typeStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="count"
                            nameKey="type"
                            label={({ type, count }) => `${type}: ${count}`}
                          >
                            {typeStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                        {t.reports.noAssessmentsCreated}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Group Analytics Tab */}
          <TabsContent value="groups" className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  Active Assessment Groups
                </CardTitle>
                <CardDescription>Performance overview for each group</CardDescription>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active groups found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group, index) => {
                      const TypeIcon = getTypeIcon(group.assessmentType);
                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
                          onClick={() => navigate(`/assessment-groups/${group.id}/report`)}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                            <TypeIcon className="w-6 h-6 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{group.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{group.assessmentTitle}</p>
                          </div>

                          <div className="hidden sm:flex items-center gap-6">
                            <div className="text-center px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{group.totalParticipants}</p>
                              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Participants</p>
                            </div>
                            <div className="text-center px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{group.completionRate}%</p>
                              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Completed</p>
                            </div>
                            {group.averageScore !== null && (
                              <div className="text-center px-3 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30">
                                <p className="text-lg font-semibold text-violet-600 dark:text-violet-400">{group.averageScore}%</p>
                                <p className="text-xs text-violet-600/70 dark:text-violet-400/70">Avg Score</p>
                              </div>
                            )}
                          </div>

                          <Button variant="outline" size="sm" className="shadow-sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employee Reports Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  Top Performers
                </CardTitle>
                <CardDescription>Employees with most completed assessments</CardDescription>
              </CardHeader>
              <CardContent>
                {topEmployees.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No completed assessments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topEmployees.map((employee, index) => (
                      <motion.div
                        key={employee.email}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/employees/${encodeURIComponent(employee.email)}`)}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white shadow-md ${
                          index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                          index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-blue-400 to-blue-500'
                        }`}>
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{employee.fullName || employee.email}</p>
                          <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{employee.assessmentsCompleted}</p>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Completed</p>
                          </div>
                          {employee.averageScore !== null && (
                            <div className="text-center px-3 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30">
                              <p className="text-lg font-semibold text-violet-600 dark:text-violet-400">{employee.averageScore}%</p>
                              <p className="text-xs text-violet-600/70 dark:text-violet-400/70">Avg Score</p>
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="shadow-sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
