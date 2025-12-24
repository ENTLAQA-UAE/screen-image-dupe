import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  Plus, 
  FileText, 
  Users, 
  BarChart3, 
  Clock,
  CheckCircle2,
  Play,
  Eye,
  MoreHorizontal,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  Loader2
} from "lucide-react";

interface AssessmentGroup {
  id: string;
  name: string;
  assessment_id: string | null;
  is_active: boolean | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  assessment?: {
    title: string;
    type: string;
  } | null;
  participants_count?: number;
  completed_count?: number;
}

interface DashboardStats {
  activeAssessments: number;
  totalParticipants: number;
  completionRate: number;
  avgScore: number;
}

const statusColors = {
  active: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-border",
  completed: "bg-accent/10 text-accent border-accent/20",
};

const getAssessmentIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive':
      return Brain;
    case 'personality':
      return Heart;
    case 'situational':
      return MessageSquare;
    case 'language':
      return Languages;
    default:
      return FileText;
  }
};

const getIconColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive':
      return "bg-blue-500/10 text-blue-500";
    case 'personality':
      return "bg-rose-500/10 text-rose-500";
    case 'situational':
      return "bg-amber-500/10 text-amber-500";
    case 'language':
      return "bg-violet-500/10 text-violet-500";
    default:
      return "bg-accent/10 text-accent";
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, roles, loading: authLoading, isSuperAdmin, isOrgAdmin, isHrAdmin } = useAuth();
  
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [assessmentGroups, setAssessmentGroups] = useState<AssessmentGroup[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeAssessments: 0,
    totalParticipants: 0,
    completionRate: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(true);

  // Redirect Super Admins to their dedicated console
  useEffect(() => {
    if (!authLoading && roles.length > 0 && isSuperAdmin()) {
      navigate('/super-admin', { replace: true });
    }
  }, [authLoading, roles, isSuperAdmin, navigate]);

  // Fetch user's organization
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setOrganizationId(profile?.organization_id || null);
    };

    fetchOrganization();
  }, [user]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch assessment groups with assessment details
        const { data: groups, error: groupsError } = await supabase
          .from('assessment_groups')
          .select(`
            *,
            assessment:assessments(title, type)
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (groupsError) {
          console.error('Error fetching groups:', groupsError);
        }

        // Fetch participants for each group
        const groupsWithCounts = await Promise.all(
          (groups || []).map(async (group) => {
            const { count: participantsCount } = await supabase
              .from('participants')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);

            const { count: completedCount } = await supabase
              .from('participants')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .eq('status', 'completed');

            return {
              ...group,
              participants_count: participantsCount || 0,
              completed_count: completedCount || 0,
            };
          })
        );

        setAssessmentGroups(groupsWithCounts);

        // Fetch stats
        const { count: activeAssessments } = await supabase
          .from('assessments')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'active');

        const { count: totalParticipants } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);

        const { count: completedParticipants } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'completed');

        // Calculate average score from completed participants
        const { data: scoresData } = await supabase
          .from('responses')
          .select('score_value, participant:participants!inner(organization_id)')
          .not('score_value', 'is', null);

        const orgScores = scoresData?.filter(
          (r: any) => r.participant?.organization_id === organizationId
        ) || [];
        
        const avgScore = orgScores.length > 0
          ? orgScores.reduce((sum: number, r: any) => sum + (r.score_value || 0), 0) / orgScores.length
          : 0;

        const completionRate = totalParticipants && totalParticipants > 0
          ? Math.round(((completedParticipants || 0) / totalParticipants) * 100)
          : 0;

        setStats({
          activeAssessments: activeAssessments || 0,
          totalParticipants: totalParticipants || 0,
          completionRate,
          avgScore: Math.round(avgScore * 10) / 10,
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [organizationId]);

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  };

  const getGroupStatus = (group: AssessmentGroup): 'active' | 'draft' | 'completed' => {
    if (!group.is_active) return 'draft';
    if (group.end_date && new Date(group.end_date) < new Date()) return 'completed';
    return 'active';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Don't render dashboard for Super Admins
  if (isSuperAdmin()) {
    return null;
  }

  const statsConfig = [
    { 
      label: "Active Assessments", 
      value: stats.activeAssessments.toString(), 
      icon: FileText,
      color: "accent"
    },
    { 
      label: "Total Participants", 
      value: stats.totalParticipants.toString(), 
      icon: Users,
      color: "highlight"
    },
    { 
      label: "Completion Rate", 
      value: `${stats.completionRate}%`, 
      icon: CheckCircle2,
      color: "success"
    },
    { 
      label: "Avg. Score", 
      value: stats.avgScore.toString(), 
      icon: BarChart3,
      color: "accent"
    },
  ];

  return (
    <DashboardLayout activeItem="Dashboard">
      <div className="p-8">
        {/* Page Title */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              Welcome back, {getUserName()}
            </motion.h1>
            <p className="text-muted-foreground">
              Here's what's happening with your assessments today.
            </p>
          </div>
          <Button variant="hero" onClick={() => navigate('/assessments')}>
            <Plus className="w-4 h-4" />
            Create Assessment
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : !organizationId ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">You are not assigned to any organization yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Please contact your administrator.</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              {statsConfig.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="p-6 rounded-2xl bg-card border border-border shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      stat.color === "accent" ? "bg-accent/10 text-accent" :
                      stat.color === "highlight" ? "bg-highlight/10 text-highlight" :
                      "bg-success/10 text-success"
                    }`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-3xl font-display font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Recent Assessment Groups */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Recent Assessment Groups
                </h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  View All
                </Button>
              </div>

              {assessmentGroups.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No assessment groups yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first assessment group to get started.</p>
                  <Button variant="hero">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assessment Group
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Group Name</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Assessment</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Status</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Progress</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">End Date</th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessmentGroups.map((group, index) => {
                        const status = getGroupStatus(group);
                        const IconComponent = getAssessmentIcon(group.assessment?.type || '');
                        const iconColor = getIconColor(group.assessment?.type || '');
                        
                        return (
                          <motion.tr
                            key={group.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
                                  <IconComponent className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-foreground">{group.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-muted-foreground">
                              {group.assessment?.title || 'No assessment'}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                statusColors[status]
                              }`}>
                                {status === "active" && <Play className="w-3 h-3 mr-1" />}
                                {status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {status === "draft" && <Clock className="w-3 h-3 mr-1" />}
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                                  <div 
                                    className="h-full gradient-accent rounded-full transition-all"
                                    style={{ 
                                      width: `${group.participants_count && group.participants_count > 0 
                                        ? (group.completed_count! / group.participants_count) * 100 
                                        : 0}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {group.completed_count}/{group.participants_count}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-muted-foreground">{formatDate(group.end_date)}</td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="w-4 h-4 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;