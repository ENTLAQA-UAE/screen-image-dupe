import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
      label: "New Assessment", 
      icon: Plus, 
      href: "/assessments/new",
      color: "bg-primary text-primary-foreground hover:bg-primary/90" 
    },
    { 
      label: "Create Group", 
      icon: FolderKanban, 
      href: "/assessment-groups",
      color: "bg-accent/10 text-accent hover:bg-accent/20" 
    },
    { 
      label: "Add Participants", 
      icon: UserPlus, 
      href: "/participants",
      color: "bg-highlight/10 text-highlight hover:bg-highlight/20" 
    },
    { 
      label: "View Results", 
      icon: ClipboardList, 
      href: "/employees",
      color: "bg-success/10 text-success hover:bg-success/20" 
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-display font-bold text-foreground mb-1"
          >
            Welcome back, {userName}
          </motion.h1>
          <p className="text-muted-foreground">
            Here's your assessment activity overview
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onClick={() => navigate(action.href)}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all ${action.color}`}
          >
            <action.icon className="w-5 h-5" />
            <span className="font-medium">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeGroups}</p>
              <p className="text-xs text-muted-foreground">Active Groups</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingAssessments}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completedToday}</p>
              <p className="text-xs text-muted-foreground">Completed Today</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-highlight" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Total Participants</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
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
                  Needs Attention
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/assessment-groups')}
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <CardDescription>Groups ending soon or with low completion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentGroups.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
                  <p className="text-muted-foreground">All groups are on track!</p>
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
                          {daysLeft <= 0 ? 'Ended' : `${daysLeft}d left`}
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
                  Recent Activity
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/participants')}
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <CardDescription>Latest assessment completions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent activity</p>
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
                        Completed • {activity.group_name}
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
