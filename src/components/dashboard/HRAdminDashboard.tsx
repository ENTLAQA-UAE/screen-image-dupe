import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { LiveProgressDashboard } from "@/components/dashboard/LiveProgressDashboard";
import {
  Plus,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Play,
  Eye,
  ArrowRight,
  FolderKanban,
  TrendingUp,
  AlertCircle,
  UserPlus,
  ClipboardList,
  Loader2,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  Activity,
} from "lucide-react";

interface AssessmentGroup {
  id: string;
  name: string;
  assessment_id: string | null;
  is_active: boolean | null;
  end_date: string | null;
  assessment?: { title: string; type: string } | null;
  participants_count: number;
  completed_count: number;
  pending_count: number;
}

interface DashboardStats {
  activeGroups: number;
  pendingAssessments: number;
  completedToday: number;
  totalParticipants: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'completed' | 'started' | 'invited';
  participant_name: string;
  group_name: string;
  timestamp: string;
}

interface HRAdminDashboardProps {
  organizationId: string;
  userName: string;
}

const getAssessmentIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive': return Brain;
    case 'personality': return Heart;
    case 'situational': return MessageSquare;
    case 'language': return Languages;
    default: return FileText;
  }
};

const getIconColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive': return "bg-blue-500/10 text-blue-500";
    case 'personality': return "bg-rose-500/10 text-rose-500";
    case 'situational': return "bg-amber-500/10 text-amber-500";
    case 'language': return "bg-violet-500/10 text-violet-500";
    default: return "bg-accent/10 text-accent";
  }
};

export function HRAdminDashboard({ organizationId, userName }: HRAdminDashboardProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeGroups: 0,
    pendingAssessments: 0,
    completedToday: 0,
    totalParticipants: 0,
    completionRate: 0,
  });
  const [urgentGroups, setUrgentGroups] = useState<AssessmentGroup[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [organizationId]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch all stats in parallel
      const [
        groupsRes,
        participantsRes,
        completedRes,
        completedTodayRes,
        pendingRes,
      ] = await Promise.all([
        supabase
          .from('assessment_groups')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_active', true),
        supabase
          .from('participants')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId),
        supabase
          .from('participants')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('status', 'completed'),
        supabase
          .from('participants')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('status', 'completed')
          .gte('completed_at', today.toISOString()),
        supabase
          .from('participants')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId)
          .in('status', ['invited', 'in_progress']),
      ]);

      const totalParticipants = participantsRes.count || 0;
      const completedCount = completedRes.count || 0;
      const completionRate = totalParticipants > 0 
        ? Math.round((completedCount / totalParticipants) * 100) 
        : 0;

      setStats({
        activeGroups: groupsRes.data?.length || 0,
        pendingAssessments: pendingRes.count || 0,
        completedToday: completedTodayRes.count || 0,
        totalParticipants,
        completionRate,
      });

      // Fetch groups that need attention (ending soon or low completion)
      const { data: groups } = await supabase
        .from('assessment_groups')
        .select(`
          id, name, assessment_id, is_active, end_date,
          assessment:assessments(title, type)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('end_date', { ascending: true })
        .limit(5);

      // Get participant counts for each group
      const groupsWithCounts = await Promise.all(
        (groups || []).map(async (group) => {
          const [totalRes, completedRes, pendingRes] = await Promise.all([
            supabase
              .from('participants')
              .select('id', { count: 'exact', head: true })
              .eq('group_id', group.id),
            supabase
              .from('participants')
              .select('id', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .eq('status', 'completed'),
            supabase
              .from('participants')
              .select('id', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .in('status', ['invited', 'in_progress']),
          ]);

          return {
            ...group,
            participants_count: totalRes.count || 0,
            completed_count: completedRes.count || 0,
            pending_count: pendingRes.count || 0,
          };
        })
      );

      // Filter to groups that need attention
      const urgent = groupsWithCounts.filter(g => {
        const hasEndingSoon = g.end_date && new Date(g.end_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const hasLowCompletion = g.participants_count > 0 && (g.completed_count / g.participants_count) < 0.5;
        return hasEndingSoon || hasLowCompletion || g.pending_count > 0;
      });

      setUrgentGroups(urgent.slice(0, 4));

      // Fetch recent activity (completed participants)
      const { data: recentCompleted } = await supabase
        .from('participants')
        .select(`
          id, full_name, completed_at, started_at,
          group:assessment_groups(name)
        `)
        .eq('organization_id', organizationId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5);

      const activity: RecentActivity[] = (recentCompleted || []).map(p => ({
        id: p.id,
        type: 'completed' as const,
        participant_name: p.full_name || 'Anonymous',
        group_name: (p.group as any)?.name || 'Unknown Group',
        timestamp: p.completed_at || '',
      }));

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const quickActions = [
    { 
      label: t.hrDashboard.newAssessment, 
      icon: Plus, 
      href: "/assessments/new",
      color: "bg-primary text-primary-foreground hover:bg-primary/90" 
    },
    { 
      label: t.hrDashboard.createGroup, 
      icon: FolderKanban, 
      href: "/assessment-groups",
      color: "bg-accent/10 text-accent hover:bg-accent/20" 
    },
    { 
      label: t.hrDashboard.addParticipants, 
      icon: UserPlus, 
      href: "/participants",
      color: "bg-highlight/10 text-highlight hover:bg-highlight/20" 
    },
    { 
      label: t.hrDashboard.viewResults, 
      icon: ClipboardList, 
      href: "/employees",
      color: "bg-success/10 text-success hover:bg-success/20" 
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-display font-bold text-foreground mb-1"
          >
            {t.dashboard.welcome}, {userName}
          </motion.h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t.hrDashboard.activityOverview}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onClick={() => navigate(action.href)}
            className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl transition-all text-left ${action.color}`}
          >
            <action.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="font-medium text-xs sm:text-sm truncate">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Live Progress Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <LiveProgressDashboard organizationId={organizationId} />
      </motion.div>

      {/* Stats Grid - Colorful Gradient Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-0 shadow-md p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
              <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.activeGroups}</p>
              <p className="text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 truncate">{t.hrDashboard.activeGroups}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-0 shadow-md p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pendingAssessments}</p>
              <p className="text-[10px] sm:text-xs text-amber-600/70 dark:text-amber-400/70 truncate">{t.hrDashboard.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-0 shadow-md p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completedToday}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600/70 dark:text-emerald-400/70 truncate">{t.hrDashboard.completedToday}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/20 border-0 shadow-md p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-violet-700 dark:text-violet-300">{stats.totalParticipants}</p>
              <p className="text-[10px] sm:text-xs text-violet-600/70 dark:text-violet-400/70 truncate">{t.hrDashboard.totalParticipants}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/30 dark:to-pink-900/20 border-0 shadow-md p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-rose-600/70 dark:text-rose-400/70">{t.hrDashboard.completionRate}</p>
            </div>
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="40%" fill="none" strokeWidth="4" className="stroke-rose-200 dark:stroke-rose-800/50" />
                <circle
                  cx="50%" cy="50%" r="40%" fill="none" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}%`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.completionRate / 100)}%`}
                  className="stroke-rose-500 transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300">
                {stats.completionRate}%
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Groups Needing Attention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  {t.hrDashboard.needsAttention}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/assessment-groups')}
                >
                  {t.common.view}
                  <ArrowRight className="w-4 h-4 ms-1" />
                </Button>
              </div>
              <CardDescription>{t.hrDashboard.groupsEndingSoon}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentGroups.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
                  <p className="text-muted-foreground">{t.hrDashboard.allOnTrack}</p>
                </div>
              ) : (
                urgentGroups.map((group) => {
                  const daysLeft = getDaysUntil(group.end_date);
                  const progress = group.participants_count > 0 
                    ? (group.completed_count / group.participants_count) * 100 
                    : 0;
                  const IconComponent = getAssessmentIcon(group.assessment?.type || '');
                  
                  return (
                    <div
                      key={group.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate('/assessment-groups')}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColor(group.assessment?.type || '')}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {group.completed_count}/{group.participants_count}
                          </span>
                        </div>
                      </div>
                      {daysLeft !== null && daysLeft <= 7 && (
                        <Badge variant={daysLeft <= 2 ? "destructive" : "secondary"} className="shrink-0">
                          {daysLeft <= 0 ? t.hrDashboard.ended : `${daysLeft} ${t.hrDashboard.daysLeft}`}
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="w-5 h-5 text-accent" />
                  {t.hrDashboard.recentActivity}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/participants')}
                >
                  {t.common.view}
                  <ArrowRight className="w-4 h-4 ms-1" />
                </Button>
              </div>
              <CardDescription>{t.hrDashboard.latestCompletions}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">{t.hrDashboard.noRecentActivity}</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{activity.participant_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {t.groupReport.completed} • {activity.group_name}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
