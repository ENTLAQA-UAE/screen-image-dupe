import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/i18n/LanguageContext";
import { getStripe } from "@/lib/stripe";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CreditCard, Users, FileText, FolderOpen, Calendar,
  CheckCircle2, ArrowUpRight, Crown, Zap, ExternalLink, Clock, Sparkles,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly_usd: number | null;
  price_annual_usd: number | null;
  max_assessments: number | null;
  max_users: number | null;
  max_groups: number | null;
  features: any;
  stripe_price_monthly_id: string | null;
  stripe_price_annual_id: string | null;
  sort_order: number | null;
}

interface UsageStats {
  assessments: number;
  hrAdmins: number;
  assessmentGroups: number;
  participants: number;
}

const PLAN_COLORS: Record<string, string> = {
  free: "border-border",
  starter: "border-blue-500",
  professional: "border-primary",
  enterprise: "border-accent",
};

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-500/10 text-blue-600",
  professional: "bg-primary/10 text-primary",
  enterprise: "bg-accent/10 text-accent",
};

const PLAN_LIMITS: Record<string, { assessments: number; hrAdmins: number; participants: number }> = {
  free: { assessments: 5, hrAdmins: 3, participants: 50 },
  starter: { assessments: 20, hrAdmins: 5, participants: 200 },
  professional: { assessments: 100, hrAdmins: 15, participants: 1000 },
  enterprise: { assessments: -1, hrAdmins: -1, participants: -1 },
};

export default function Subscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isOrgAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const {
    subscription, isTrial, isTrialExpired, isActive, isPaid,
    daysRemaining, planSlug, organizationId, loading: subLoading, refresh,
  } = useSubscription();

  const [organization, setOrganization] = useState<{ id: string; name: string; plan: string; is_active: boolean } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Handle checkout result from URL params
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast({
        title: "Subscription activated!",
        description: "Your payment was successful. Welcome to your new plan!",
      });
      refresh();
      // Clean URL
      navigate("/subscription", { replace: true });
    } else if (checkout === "cancel") {
      toast({
        variant: "destructive",
        title: "Checkout canceled",
        description: "No changes were made to your subscription.",
      });
      navigate("/subscription", { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !isOrgAdmin() && !isSuperAdmin()) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isOrgAdmin, isSuperAdmin, navigate]);

  useEffect(() => {
    if (user && !authLoading && organizationId) {
      fetchData();
    }
  }, [user, authLoading, organizationId]);

  const fetchData = async () => {
    if (!user || !organizationId) return;
    setLoading(true);

    try {
      // Fetch org, plans, and usage in parallel
      const [orgRes, plansRes, assessmentsRes, groupsRes, participantsRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from("organizations").select("id, name, plan, is_active").eq("id", organizationId).maybeSingle(),
        supabase.from("plans").select("id, name, slug, description, price_monthly_usd, price_annual_usd, max_assessments, max_users, max_groups, features, stripe_price_monthly_id, stripe_price_annual_id, sort_order").eq("is_active", true).eq("is_public", true).order("sort_order", { ascending: true }),
        supabase.from("assessments").select("id", { count: "exact" }).eq("organization_id", organizationId),
        supabase.from("assessment_groups").select("id", { count: "exact" }).eq("organization_id", organizationId),
        supabase.from("participants").select("id", { count: "exact" }).eq("organization_id", organizationId),
        supabase.from("profiles").select("id").eq("organization_id", organizationId),
        supabase.from("user_roles").select("user_id").eq("role", "hr_admin"),
      ]);

      if (orgRes.data) setOrganization(orgRes.data);
      if (plansRes.data) setPlans(plansRes.data);

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

  const handleCheckout = async (plan: Plan) => {
    setCheckingOut(plan.id);

    try {
      const stripe = await getStripe();
      if (!stripe) {
        toast({
          variant: "destructive",
          title: "Stripe not configured",
          description: "Payment processing is not set up. Please contact your administrator.",
        });
        setCheckingOut(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planId: plan.id,
          billingCycle,
          successUrl: `${window.location.origin}/subscription?checkout=success`,
          cancelUrl: `${window.location.origin}/subscription?checkout=cancel`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create checkout session");
      }

      const { url } = response.data;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setCheckingOut(null);
    }
  };

  const handleOpenPortal = async () => {
    setOpeningPortal(true);

    try {
      const response = await supabase.functions.invoke("create-portal-session", {
        body: {
          returnUrl: `${window.location.origin}/subscription`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to open billing portal");
      }

      const { url } = response.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Portal unavailable",
        description: error.message || "Could not open billing portal.",
      });
    } finally {
      setOpeningPortal(false);
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

  if (authLoading || subLoading || loading) {
    return (
      <DashboardLayout activeItem="Subscription">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const currentPlanSlug = planSlug || organization?.plan || "free";
  const limits = PLAN_LIMITS[currentPlanSlug] || PLAN_LIMITS.free;

  const usageItems = [
    { label: t.orgDashboard.assessments, icon: FileText, current: usage?.assessments || 0, limit: limits.assessments },
    { label: t.orgDashboard.hrAdmins, icon: Users, current: usage?.hrAdmins || 0, limit: limits.hrAdmins },
    { label: t.hrDashboard.totalParticipants, icon: FolderOpen, current: usage?.participants || 0, limit: limits.participants },
  ];

  const getPrice = (plan: Plan) => {
    if (billingCycle === "annual" && plan.price_annual_usd) {
      return Math.round(plan.price_annual_usd / 12);
    }
    return plan.price_monthly_usd || 0;
  };

  const canCheckout = (plan: Plan) => {
    const priceId = billingCycle === "annual" ? plan.stripe_price_annual_id : plan.stripe_price_monthly_id;
    return !!priceId && plan.slug !== currentPlanSlug;
  };

  const isCurrentPlan = (plan: Plan) => plan.slug === currentPlanSlug;

  return (
    <DashboardLayout activeItem="Subscription">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground mb-1">{t.subscription.title}</h1>
            <p className="text-muted-foreground">{t.subscription.description}</p>
          </motion.div>

          {/* Billing Portal Button (for paid subscribers) */}
          {isPaid && subscription?.stripe_customer_id && (
            <Button variant="outline" onClick={handleOpenPortal} disabled={openingPortal}>
              {openingPortal ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <ExternalLink className="w-4 h-4 me-2" />}
              Manage Billing
            </Button>
          )}
        </div>

        {/* Current Plan Status Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className={`border-2 ${PLAN_COLORS[currentPlanSlug] || "border-border"}`}>
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{subscription?.plan?.name || "Free"} Plan</h3>
                      <Badge className={PLAN_BADGE_COLORS[currentPlanSlug] || PLAN_BADGE_COLORS.free}>
                        {currentPlanSlug}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isTrial && !isTrialExpired && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Trial — {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                        </span>
                      )}
                      {isTrialExpired && (
                        <span className="text-destructive flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Trial expired — upgrade to continue
                        </span>
                      )}
                      {isPaid && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          Active — renews {new Date(subscription!.current_period_end).toLocaleDateString()}
                        </span>
                      )}
                      {isActive && !isTrial && !isPaid && "Active"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {organization && (
                    <Badge variant="outline" className="text-xs">{organization.name}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">{t.subscription.usageOverview}</CardTitle>
              <CardDescription>{t.subscription.trackUsage}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {usageItems.map((item) => {
                  const percentage = getUsagePercentage(item.current, item.limit);
                  const isUnlimited = item.limit === -1;

                  return (
                    <div key={item.label} className="space-y-2.5 p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <span className={`text-sm font-medium ${isUnlimited ? "text-muted-foreground" : getUsageColor(percentage)}`}>
                          {isUnlimited ? t.orgDashboard.unlimited : `${item.current} / ${item.limit}`}
                        </span>
                      </div>
                      {!isUnlimited && (
                        <Progress value={percentage} className="h-1.5" />
                      )}
                      {isUnlimited && (
                        <p className="text-xs text-muted-foreground">{item.current} {t.subscription.currentlyInUse}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plans Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">{t.subscription.availablePlans}</h2>
              <p className="text-sm text-muted-foreground">{t.subscription.comparePlans}</p>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/60">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  billingCycle === "monthly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  billingCycle === "annual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Annual
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-[10px] px-1.5 py-0">-20%</Badge>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const price = getPrice(plan);
              const isCurrent = isCurrentPlan(plan);
              const canBuy = canCheckout(plan);
              const isCheckingOut = checkingOut === plan.id;
              const features = Array.isArray(plan.features) ? plan.features : [];
              const planLimits = PLAN_LIMITS[plan.slug] || { assessments: 0, hrAdmins: 0, participants: 0 };

              return (
                <Card
                  key={plan.id}
                  className={`relative transition-all ${
                    isCurrent ? `border-2 ${PLAN_COLORS[plan.slug]} bg-card shadow-md` : "border hover:shadow-md"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-xs shadow-sm">
                        {t.subscription.current}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-center justify-between">
                      <Badge className={PLAN_BADGE_COLORS[plan.slug] || PLAN_BADGE_COLORS.free}>
                        {plan.name}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">${price}</span>
                        {price > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                      </div>
                      {billingCycle === "annual" && plan.price_annual_usd && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ${plan.price_annual_usd} billed annually
                        </p>
                      )}
                      {price === 0 && <p className="text-xs text-muted-foreground mt-0.5">Free forever</p>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-5">
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}

                    {/* Limits */}
                    <div className="space-y-1.5 text-sm">
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
                        </span> participants/mo
                      </p>
                    </div>

                    {/* Features from DB */}
                    {features.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-border/60">
                        {features.map((feature: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      {isCurrent ? (
                        <Button variant="outline" className="w-full" disabled>
                          <CheckCircle2 className="w-4 h-4 me-2" />
                          Current Plan
                        </Button>
                      ) : canBuy ? (
                        <Button
                          className="w-full"
                          onClick={() => handleCheckout(plan)}
                          disabled={!!checkingOut}
                        >
                          {isCheckingOut ? (
                            <Loader2 className="w-4 h-4 me-2 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4 me-2" />
                          )}
                          {isCheckingOut ? "Redirecting..." : "Upgrade"}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          <ArrowUpRight className="w-4 h-4 me-2" />
                          Contact Sales
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Billing Portal Info */}
        {isPaid && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-muted/30">
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Manage your billing</p>
                      <p className="text-xs text-muted-foreground">
                        Update payment method, view invoices, or cancel your subscription
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleOpenPortal} disabled={openingPortal}>
                    {openingPortal ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <ExternalLink className="w-4 h-4 me-2" />}
                    Billing Portal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
