import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  RefreshCw,
  Eye,
  Brain,
  Heart,
  MessageSquare,
  Languages,
  FileText,
} from "lucide-react";

interface LiveGroup {
  id: string;
  name: string;
  assessment_type: string;
  total: number;
  completed: number;
  in_progress: number;
  invited: number;
  completion_rate: number;
}

interface LiveStats {
  totalActive: number;
  inProgress: number;
  completedToday: number;
  completionRate: number;
  recentCompletions: RecentCompletion[];
}

interface RecentCompletion {
  id: string;
  name: string;
  group: string;
  time: string;
}

interface LiveProgressDashboardProps {
  organizationId: string;
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

const getTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'cognitive': return { bg: "from-blue-500 to-blue-600", light: "bg-blue-50 dark:bg-blue-950/30" };
    case 'personality': return { bg: "from-rose-500 to-pink-500", light: "bg-rose-50 dark:bg-rose-950/30" };
    case 'situational': return { bg: "from-amber-500 to-orange-500", light: "bg-amber-50 dark:bg-amber-950/30" };
    case 'language': return { bg: "from-violet-500 to-purple-500", light: "bg-violet-50 dark:bg-violet-950/30" };
    default: return { bg: "from-slate-500 to-slate-600", light: "bg-slate-50 dark:bg-slate-950/30" };
  }
};

export function LiveProgressDashboard({ organizationId }: LiveProgressDashboardProps) {
  const { t } = useLanguage();
  const [liveGroups, setLiveGroups] = useState<LiveGroup[]>([]);
  const [stats, setStats] = useState<LiveStats>({
    totalActive: 0,
    inProgress: 0,
    completedToday: 0,
    completionRate: 0,
    recentCompletions: [],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchLiveData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch active groups with assessment info
      const { data: groups } = await supabase
        .from('assessment_groups')
        .select(`
          id, name,
          assessment:assessments(type)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Fetch participant stats for each group
      const groupsWithStats = await Promise.all(
        (groups || []).map(async (group) => {
          const [totalRes, completedRes, inProgressRes, invitedRes] = await Promise.all([
            supabase.from('participants').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
            supabase.from('participants').select('id', { count: 'exact', head: true }).eq('group_id', group.id).eq('status', 'completed'),
            supabase.from('participants').select('id', { count: 'exact', head: true }).eq('group_id', group.id).eq('status', 'in_progress'),
            supabase.from('participants').select('id', { count: 'exact', head: true }).eq('group_id', group.id).eq('status', 'invited'),
          ]);

          const total = totalRes.count || 0;
          const completed = completedRes.count || 0;
          const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            id: group.id,
            name: group.name,
            assessment_type: (group.assessment as any)?.type || 'general',
            total,
            completed,
            in_progress: inProgressRes.count || 0,
            invited: invitedRes.count || 0,
            completion_rate: rate,
          };
        })
      );

      // Filter to only groups with participants
      const activeGroups = groupsWithStats.filter(g => g.total > 0);
      setLiveGroups(activeGroups);

      // Fetch overall stats
      const [totalActiveRes, inProgressRes, completedTodayRes, totalParticipantsRes, totalCompletedRes] = await Promise.all([
        supabase.from('participants').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).in('status', ['invited', 'in_progress']),
        supabase.from('participants').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'in_progress'),
        supabase.from('participants').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'completed').gte('completed_at', today.toISOString()),
        supabase.from('participants').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
        supabase.from('participants').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'completed'),
      ]);

      // Fetch recent completions
      const { data: recentData } = await supabase
        .from('participants')
        .select('id, full_name, completed_at, group:assessment_groups(name)')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      const totalP = totalParticipantsRes.count || 0;
      const completedP = totalCompletedRes.count || 0;

      setStats({
        totalActive: totalActiveRes.count || 0,
        inProgress: inProgressRes.count || 0,
        completedToday: completedTodayRes.count || 0,
        completionRate: totalP > 0 ? Math.round((completedP / totalP) * 100) : 0,
        recentCompletions: (recentData || []).map(p => ({
          id: p.id,
          name: p.full_name || 'Anonymous',
          group: (p.group as any)?.name || 'Unknown',
          time: formatTimeAgo(p.completed_at || ''),
        })),
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [organizationId]);

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Initial fetch and set up real-time subscription
  useEffect(() => {
    fetchLiveData();

    // Set up real-time subscription for participant changes
    const channel = supabase
      .channel('live-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          fetchLiveData();
        }
      )
      .subscribe();

    // Also refresh every 30 seconds
    const interval = setInterval(fetchLiveData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [organizationId, fetchLiveData]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Live Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Live Progress Monitor</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Updated {formatTimeAgo(lastUpdated.toISOString())}</span>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 rounded-xl p-3 sm:p-4 border-0 shadow-sm"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completedToday}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600/70 dark:text-emerald-400/70 truncate">Completed Today</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl p-3 sm:p-4 border-0 shadow-sm"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.inProgress}</p>
              <p className="text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 truncate">In Progress</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 rounded-xl p-3 sm:p-4 border-0 shadow-sm"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.totalActive}</p>
              <p className="text-[10px] sm:text-xs text-amber-600/70 dark:text-amber-400/70 truncate">Pending</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/20 rounded-xl p-3 sm:p-4 border-0 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-violet-600/70 dark:text-violet-400/70 mb-1">Completion Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-violet-700 dark:text-violet-300">{stats.completionRate}%</p>
            </div>
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="45%" fill="none" strokeWidth="3" className="stroke-violet-200 dark:stroke-violet-800/50" />
                <circle
                  cx="50%" cy="50%" r="45%" fill="none" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}%`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - stats.completionRate / 100)}%`}
                  className="stroke-violet-500 transition-all duration-700 ease-out"
                />
              </svg>
              <TrendingUp className="absolute inset-0 m-auto w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Active Groups Progress */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              Active Assessments
            </CardTitle>
            <Badge variant="secondary" className="text-xs w-fit">
              {liveGroups.length} Active Groups
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {liveGroups.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Eye className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No active assessments with participants</p>
              </div>
            ) : (
              liveGroups.map((group, index) => {
                const IconComponent = getAssessmentIcon(group.assessment_type);
                const colors = getTypeColor(group.assessment_type);

                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-xl p-3 sm:p-4 ${colors.light} border border-border/50`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg shrink-0`}>
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{group.name}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            {group.in_progress > 0 && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                <Activity className="w-3 h-3 mr-1" />
                                {group.in_progress} active
                              </Badge>
                            )}
                            <span className="text-xs font-medium text-muted-foreground">
                              {group.completed}/{group.total}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Progress 
                            value={group.completion_rate} 
                            className="h-2 flex-1"
                          />
                          <span className="text-xs sm:text-sm font-bold text-foreground min-w-[3rem] text-right">
                            {group.completion_rate}%
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {group.total} total
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> {group.completed} done
                          </span>
                          {group.invited > 0 && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Clock className="w-3 h-3" /> {group.invited} pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Recent Completions */}
      {stats.recentCompletions.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              Recent Completions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-2 sm:space-y-3">
              <AnimatePresence mode="popLayout">
                {stats.recentCompletions.map((completion, index) => (
                  <motion.div
                    key={completion.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 sm:p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0">
                      {completion.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{completion.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{completion.group}</p>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {completion.time}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
