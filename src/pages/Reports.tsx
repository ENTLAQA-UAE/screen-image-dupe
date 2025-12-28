import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
              Reports & Analytics
            </motion.h1>
            <p className="text-muted-foreground">
              Comprehensive insights for {orgName}
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => exportToCsv({
              filename: 'assessment_results',
              headers: ['Employee Code', 'Full Name', 'Email', 'Department', 'Job Title', 'Group', 'Assessment', 'Type', 'Score %', 'Completed At'],
              data: allResults,
              columnMap: {
                'Employee Code': 'employee_code',
                'Full Name': 'full_name',
                'Email': 'email',
                'Department': 'department',
                'Job Title': 'job_title',
                'Group': 'group_name',
                'Assessment': 'assessment_title',
                'Type': 'assessment_type',
                'Score %': 'score_percentage',
                'Completed At': 'completed_at',
              }
            })}
            disabled={allResults.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Results CSV
          </Button>
        </div>

        {/* Overview Stats */}
        {stats && (
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
                      <p className="text-3xl font-bold">{stats.averageCompletionRate}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.completedParticipants} of {stats.totalParticipants} participants
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-l-4 border-l-accent">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Groups</p>
                      <p className="text-3xl font-bold">{stats.activeGroups}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-accent" />
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
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                      <p className="text-3xl font-bold">{stats.averageScore !== null ? `${stats.averageScore}%` : "-"}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Organization Overview</TabsTrigger>
            <TabsTrigger value="groups">Group Analytics</TabsTrigger>
            <TabsTrigger value="employees">Employee Reports</TabsTrigger>
          </TabsList>

          {/* Organization Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Completion Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5" />
                    Completion Trend (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#colorCompletions)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No completion data in the last 30 days
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assessment Types Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PieChart className="w-5 h-5" />
                    Assessment Types
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
                          innerRadius={50}
                          outerRadius={90}
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
                      No assessments created yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Group Analytics Tab */}
          <TabsContent value="groups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Assessment Groups</CardTitle>
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
                          className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/assessment-groups/${group.id}/report`)}
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <TypeIcon className="w-6 h-6 text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{group.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{group.assessmentTitle}</p>
                          </div>

                          <div className="hidden sm:flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-lg font-semibold">{group.totalParticipants}</p>
                              <p className="text-xs text-muted-foreground">Participants</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-success">{group.completionRate}%</p>
                              <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                            {group.averageScore !== null && (
                              <div className="text-center">
                                <p className="text-lg font-semibold text-primary">{group.averageScore}%</p>
                                <p className="text-xs text-muted-foreground">Avg Score</p>
                              </div>
                            )}
                          </div>

                          <Button variant="ghost" size="sm">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
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
                        className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/employees/${encodeURIComponent(employee.email)}`)}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-semibold text-primary">
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{employee.fullName || employee.email}</p>
                          <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-semibold">{employee.assessmentsCompleted}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          {employee.averageScore !== null && (
                            <div className="text-center">
                              <p className="text-lg font-semibold text-primary">{employee.averageScore}%</p>
                              <p className="text-xs text-muted-foreground">Avg Score</p>
                            </div>
                          )}
                          <Button variant="ghost" size="sm">
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
