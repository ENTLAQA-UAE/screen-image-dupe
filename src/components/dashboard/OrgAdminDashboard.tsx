import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Settings,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface OrgStats {
  totalAssessments: number;
  totalHRAdmins: number;
  maxHRAdmins: number;
  totalParticipants: number;
  assessmentLimit: number;
  completionRate: number;
  plan: string;
  isActive: boolean;
}

interface OrgAdminDashboardProps {
  organizationId: string;
  organizationName: string;
  userName: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-500/10 text-blue-600",
  professional: "bg-primary/10 text-primary",
  enterprise: "bg-accent/10 text-accent",
};

export function OrgAdminDashboard({ organizationId, organizationName, userName }: OrgAdminDashboardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrgStats>({
    totalAssessments: 0,
    totalHRAdmins: 0,
    maxHRAdmins: 5,
    totalParticipants: 0,
    assessmentLimit: 50,
    completionRate: 0,
    plan: 'free',
    isActive: true,
  });

  useEffect(() => {
    fetchOrgStats();
  }, [organizationId]);

  const fetchOrgStats = async () => {
    try {
      const [orgRes, assessmentsRes, participantsRes, completedRes, profilesRes, rolesRes] = await Promise.all([
        supabase
          .from('organizations')
          .select('plan, max_hr_admins, assessment_limit, is_active')
          .eq('id', organizationId)
          .maybeSingle(),
        supabase
          .from('assessments')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId),
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
          .from('profiles')
          .select('id')
          .eq('organization_id', organizationId),
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'hr_admin'),
      ]);

      const org = orgRes.data;
      const profileIds = new Set(profilesRes.data?.map(p => p.id) || []);
      const hrAdminCount = rolesRes.data?.filter(r => profileIds.has(r.user_id)).length || 0;
      
      const totalParticipants = participantsRes.count || 0;
      const completedCount = completedRes.count || 0;
      const completionRate = totalParticipants > 0 
        ? Math.round((completedCount / totalParticipants) * 100) 
        : 0;

      setStats({
        totalAssessments: assessmentsRes.count || 0,
        totalHRAdmins: hrAdminCount,
        maxHRAdmins: org?.max_hr_admins || 5,
        totalParticipants,
        assessmentLimit: org?.assessment_limit || 50,
        completionRate,
        plan: org?.plan || 'free',
        isActive: org?.is_active ?? true,
      });
    } catch (error) {
      console.error('Error fetching org stats:', error);
    } finally {
      setLoading(false);
    }
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
      label: "Organization Settings", 
      description: "Branding & configuration",
      icon: Building2, 
      href: "/settings",
    },
    { 
      label: "User Management", 
      description: "Manage HR Admins",
      icon: Users, 
      href: "/user-management",
    },
    { 
      label: "Subscription", 
      description: "Plan & usage",
      icon: CreditCard, 
      href: "/subscription",
    },
  ];

  const usageItems = [
    {
      label: "Assessments",
      current: stats.totalAssessments,
      max: stats.assessmentLimit,
      icon: FileText,
    },
    {
      label: "HR Admins",
      current: stats.totalHRAdmins,
      max: stats.maxHRAdmins,
      icon: Shield,
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
            Organization admin dashboard for {organizationName}
          </p>
        </div>
        <Badge className={PLAN_COLORS[stats.plan] || PLAN_COLORS.free}>
          {stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)} Plan
        </Badge>
      </div>

      {/* Status Alert */}
      {!stats.isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-destructive" />
              <p className="text-destructive font-medium">
                Your organization is currently inactive. Please contact support to reactivate.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-4 gap-4"
      >
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
              <p className="text-3xl font-bold mt-1">{stats.totalAssessments}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.assessmentLimit === -1 ? 'Unlimited' : `of ${stats.assessmentLimit} limit`}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">HR Admins</p>
              <p className="text-3xl font-bold mt-1">{stats.totalHRAdmins}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-highlight" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.maxHRAdmins === -1 ? 'Unlimited' : `of ${stats.maxHRAdmins} limit`}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Participants</p>
              <p className="text-3xl font-bold mt-1">{stats.totalParticipants}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-success" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            All time
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-3xl font-bold mt-1">{stats.completionRate}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Assessment completion
          </p>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Manage your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.href)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{action.label}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Usage Overview
                  </CardTitle>
                  <CardDescription>Current plan usage</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/subscription')}
                >
                  Details
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {usageItems.map((item) => {
                const isUnlimited = item.max === -1;
                const percentage = isUnlimited ? 0 : (item.current / item.max) * 100;
                const isNearLimit = percentage >= 80;
                
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <span className={`text-sm font-medium ${isNearLimit ? 'text-warning' : 'text-muted-foreground'}`}>
                        {isUnlimited ? `${item.current} (Unlimited)` : `${item.current} / ${item.max}`}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <Progress 
                        value={percentage} 
                        className={`h-2 ${isNearLimit ? '[&>div]:bg-warning' : ''}`}
                      />
                    )}
                  </div>
                );
              })}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)}
                    </p>
                  </div>
                  {stats.plan !== 'enterprise' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/subscription')}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
