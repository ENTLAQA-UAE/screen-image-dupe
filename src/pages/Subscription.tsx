import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Users, FileText, FolderOpen, Calendar, CheckCircle2, ArrowUpRight } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  plan: string;
  max_hr_admins: number;
  assessment_limit: number;
  billing_cycle_start: string | null;
  is_active: boolean;
}

interface UsageStats {
  assessments: number;
  hrAdmins: number;
  assessmentGroups: number;
  participants: number;
}

const PLAN_DETAILS: Record<string, { 
  name: string; 
  description: string; 
  features: string[];
  color: string;
}> = {
  free: {
    name: "Free",
    description: "Perfect for trying out the platform",
    features: ["5 assessments", "3 HR admins", "50 participants/month", "Basic reports"],
    color: "bg-muted text-muted-foreground",
  },
  starter: {
    name: "Starter",
    description: "For small teams getting started",
    features: ["20 assessments", "5 HR admins", "200 participants/month", "Advanced reports", "Email support"],
    color: "bg-blue-500/10 text-blue-600",
  },
  professional: {
    name: "Professional",
    description: "For growing organizations",
    features: ["100 assessments", "15 HR admins", "1,000 participants/month", "AI-powered insights", "Priority support"],
    color: "bg-primary/10 text-primary",
  },
  enterprise: {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    features: ["Unlimited assessments", "Unlimited HR admins", "Unlimited participants", "Custom integrations", "Dedicated support"],
    color: "bg-accent/10 text-accent",
  },
};

const PLAN_LIMITS: Record<string, { assessments: number; hrAdmins: number; participants: number }> = {
  free: { assessments: 5, hrAdmins: 3, participants: 50 },
  starter: { assessments: 20, hrAdmins: 5, participants: 200 },
  professional: { assessments: 100, hrAdmins: 15, participants: 1000 },
  enterprise: { assessments: -1, hrAdmins: -1, participants: -1 },
};

export default function Subscription() {
  const navigate = useNavigate();
  const { user, isOrgAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isOrgAdmin() && !isSuperAdmin()) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isOrgAdmin, isSuperAdmin, navigate]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();
      
      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }
      
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, plan, max_hr_admins, assessment_limit, billing_cycle_start, is_active")
        .eq("id", profile.organization_id)
        .maybeSingle();
      
      if (orgError) throw orgError;
      setOrganization(org);
      
      // Get usage stats
      const [assessmentsRes, groupsRes, participantsRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from("assessments").select("id", { count: "exact" }).eq("organization_id", profile.organization_id),
        supabase.from("assessment_groups").select("id", { count: "exact" }).eq("organization_id", profile.organization_id),
        supabase.from("participants").select("id", { count: "exact" }).eq("organization_id", profile.organization_id),
        supabase.from("profiles").select("id").eq("organization_id", profile.organization_id),
        supabase.from("user_roles").select("user_id").eq("role", "hr_admin"),
      ]);
      
      // Count HR admins in this org
      const profileIds = new Set(profilesRes.data?.map(p => p.id) || []);
      const hrAdminCount = rolesRes.data?.filter(r => profileIds.has(r.user_id)).length || 0;
      
      setUsage({
        assessments: assessmentsRes.count || 0,
        hrAdmins: hrAdminCount,
        assessmentGroups: groupsRes.count || 0,
        participants: participantsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-primary";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout activeItem="Subscription">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const plan = organization?.plan || "free";
  const planDetails = PLAN_DETAILS[plan] || PLAN_DETAILS.free;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const usageItems = [
    {
      label: "Assessments",
      icon: FileText,
      current: usage?.assessments || 0,
      limit: organization?.assessment_limit || limits.assessments,
    },
    {
      label: "HR Admins",
      icon: Users,
      current: usage?.hrAdmins || 0,
      limit: organization?.max_hr_admins || limits.hrAdmins,
    },
    {
      label: "Participants",
      icon: FolderOpen,
      current: usage?.participants || 0,
      limit: limits.participants,
    },
  ];

  return (
    <DashboardLayout activeItem="Subscription">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-display font-bold text-foreground mb-1"
          >
            Subscription & Usage
          </motion.h1>
          <p className="text-muted-foreground">
            Manage your plan and monitor usage limits
          </p>
        </div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>
                  Your organization's subscription details
                </CardDescription>
              </div>
              <Badge className={planDetails.color}>
                {planDetails.name}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Plan Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{planDetails.name} Plan</h3>
                    <p className="text-muted-foreground">{planDetails.description}</p>
                  </div>
                  <ul className="space-y-2">
                    {planDetails.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Billing Info */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Organization</span>
                      <span className="font-medium">{organization?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={organization?.is_active ? "default" : "destructive"}>
                        {organization?.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Billing Cycle Start
                      </span>
                      <span className="font-medium">{formatDate(organization?.billing_cycle_start || null)}</span>
                    </div>
                  </div>
                  
                  {plan !== "enterprise" && (
                    <Button className="w-full" variant="outline">
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>
                Track your current usage against plan limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {usageItems.map((item) => {
                  const percentage = getUsagePercentage(item.current, item.limit);
                  const isUnlimited = item.limit === -1;
                  
                  return (
                    <div key={item.label} className="space-y-3 p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <span className={`text-sm font-medium ${isUnlimited ? "text-muted-foreground" : getUsageColor(percentage)}`}>
                          {isUnlimited ? "Unlimited" : `${item.current} / ${item.limit}`}
                        </span>
                      </div>
                      {!isUnlimited && (
                        <div className="space-y-1">
                          <Progress 
                            value={percentage} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground text-right">
                            {percentage.toFixed(0)}% used
                          </p>
                        </div>
                      )}
                      {isUnlimited && (
                        <p className="text-xs text-muted-foreground">
                          {item.current} currently in use
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>
                Compare plans and find the right fit for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(PLAN_DETAILS).map(([key, details]) => {
                  const isCurrentPlan = key === plan;
                  const planLimits = PLAN_LIMITS[key];
                  
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrentPlan 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={details.color}>{details.name}</Badge>
                          {isCurrentPlan && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{details.description}</p>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">
                              {planLimits.assessments === -1 ? "Unlimited" : planLimits.assessments}
                            </span> assessments
                          </p>
                          <p>
                            <span className="font-medium">
                              {planLimits.hrAdmins === -1 ? "Unlimited" : planLimits.hrAdmins}
                            </span> HR admins
                          </p>
                          <p>
                            <span className="font-medium">
                              {planLimits.participants === -1 ? "Unlimited" : planLimits.participants}
                            </span> participants
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
