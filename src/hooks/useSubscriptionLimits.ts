import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Fallback limits used when a plan isn't found in the DB.
 * The real source of truth is the `plans` table columns:
 * max_assessments, max_groups, max_users (HR admins).
 * -1 = unlimited.
 */
const FALLBACK_LIMITS: Record<string, PlanLimits> = {
  free: { assessments: 5, groups: 3, participants: 50, hrAdmins: 2 },
  starter: { assessments: 20, groups: 10, participants: 200, hrAdmins: 5 },
  professional: { assessments: 100, groups: 50, participants: 1000, hrAdmins: 15 },
  enterprise: { assessments: -1, groups: -1, participants: -1, hrAdmins: -1 },
};

export interface PlanLimits {
  assessments: number;
  groups: number;
  participants: number;
  hrAdmins: number;
}

export interface UsageStats {
  assessments: number;
  groups: number;
  participants: number;
  hrAdmins: number;
}

export interface SubscriptionLimits {
  plan: string;
  limits: PlanLimits;
  usage: UsageStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canCreate: (resource: keyof PlanLimits) => boolean;
  getRemainingCount: (resource: keyof PlanLimits) => number;
  getUsagePercentage: (resource: keyof PlanLimits) => number;
  isNearLimit: (resource: keyof PlanLimits) => boolean;
  organizationId: string | null;
}

/**
 * Resolve plan limits from DB plan columns, falling back to hardcoded defaults.
 */
function resolveLimits(
  planSlug: string,
  dbPlan: { max_assessments: number | null; max_groups: number | null; max_users: number | null } | null
): PlanLimits {
  const fallback = FALLBACK_LIMITS[planSlug] || FALLBACK_LIMITS.free;

  if (!dbPlan) return fallback;

  return {
    assessments: dbPlan.max_assessments ?? fallback.assessments,
    groups: dbPlan.max_groups ?? fallback.groups,
    // max_users in the plans table maps to HR admins
    hrAdmins: dbPlan.max_users ?? fallback.hrAdmins,
    // participants still use fallback until plans table gets a max_participants column
    participants: fallback.participants,
  };
}

export function useSubscriptionLimits(): SubscriptionLimits {
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [limits, setLimits] = useState<PlanLimits>(FALLBACK_LIMITS.free);
  const [usage, setUsage] = useState<UsageStats>({
    assessments: 0,
    groups: 0,
    participants: 0,
    hrAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      setOrganizationId(profile.organization_id);

      // Get org plan slug, then fetch plan limits from DB via subscription → plans join
      const [orgRes, subRes, assessmentsRes, groupsRes, participantsRes, profilesRes] = await Promise.all([
        supabase.from("organizations").select("plan").eq("id", profile.organization_id).single(),
        supabase
          .from("subscriptions")
          .select("plans (slug, max_assessments, max_groups, max_users)")
          .eq("organization_id", profile.organization_id)
          .maybeSingle(),
        supabase
          .from("assessments")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id),
        supabase
          .from("assessment_groups")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id),
        supabase
          .from("participants")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id),
      ]);

      const planSlug = (subRes.data?.plans as any)?.slug || orgRes.data?.plan || "free";
      setPlan(planSlug);

      const dbPlan = subRes.data?.plans as { max_assessments: number | null; max_groups: number | null; max_users: number | null } | null;
      setLimits(resolveLimits(planSlug, dbPlan));

      setUsage({
        assessments: assessmentsRes.count || 0,
        groups: groupsRes.count || 0,
        participants: participantsRes.count || 0,
        hrAdmins: profilesRes.count || 0,
      });
    } catch (err: any) {
      console.error("Error fetching subscription limits:", err);
      setError(err.message || "Failed to fetch subscription limits");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const canCreate = useCallback(
    (resource: keyof PlanLimits): boolean => {
      const limit = limits[resource];
      if (limit === -1) return true;
      return usage[resource] < limit;
    },
    [limits, usage]
  );

  const getRemainingCount = useCallback(
    (resource: keyof PlanLimits): number => {
      const limit = limits[resource];
      if (limit === -1) return Infinity;
      return Math.max(0, limit - usage[resource]);
    },
    [limits, usage]
  );

  const getUsagePercentage = useCallback(
    (resource: keyof PlanLimits): number => {
      const limit = limits[resource];
      if (limit === -1) return 0;
      return Math.min(100, (usage[resource] / limit) * 100);
    },
    [limits, usage]
  );

  const isNearLimit = useCallback(
    (resource: keyof PlanLimits): boolean => {
      return getUsagePercentage(resource) >= 80;
    },
    [getUsagePercentage]
  );

  return {
    plan,
    limits,
    usage,
    loading,
    error,
    refresh: fetchUsage,
    canCreate,
    getRemainingCount,
    getUsagePercentage,
    isNearLimit,
    organizationId,
  };
}

// Translations for limit messages
export const limitTranslations = {
  en: {
    limitReached: "Limit reached",
    assessmentLimitReached: "You have reached your assessment limit ({limit}). Please upgrade your plan to create more.",
    groupLimitReached: "You have reached your assessment group limit ({limit}). Please upgrade your plan to create more.",
    participantLimitReached: "You have reached your participant limit ({limit}). Please upgrade your plan to add more.",
    hrAdminLimitReached: "You have reached your HR admin limit ({limit}). Please upgrade your plan to add more.",
    nearLimit: "You are approaching your {resource} limit ({used}/{limit}).",
    unlimited: "Unlimited",
    upgradePlan: "Upgrade Plan",
    currentUsage: "Current usage",
    of: "of",
  },
  ar: {
    limitReached: "تم الوصول للحد الأقصى",
    assessmentLimitReached: "لقد وصلت إلى الحد الأقصى للتقييمات ({limit}). يرجى ترقية خطتك لإنشاء المزيد.",
    groupLimitReached: "لقد وصلت إلى الحد الأقصى لمجموعات التقييم ({limit}). يرجى ترقية خطتك لإنشاء المزيد.",
    participantLimitReached: "لقد وصلت إلى الحد الأقصى للمشاركين ({limit}). يرجى ترقية خطتك لإضافة المزيد.",
    hrAdminLimitReached: "لقد وصلت إلى الحد الأقصى لمدراء الموارد البشرية ({limit}). يرجى ترقية خطتك لإضافة المزيد.",
    nearLimit: "أنت على وشك الوصول إلى الحد الأقصى لـ {resource} ({used}/{limit}).",
    unlimited: "غير محدود",
    upgradePlan: "ترقية الخطة",
    currentUsage: "الاستخدام الحالي",
    of: "من",
  },
};
