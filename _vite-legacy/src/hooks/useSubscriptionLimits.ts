import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Plan limits configuration
export const PLAN_LIMITS: Record<string, { assessments: number; groups: number; participants: number; hrAdmins: number }> = {
  free: { assessments: 5, groups: 3, participants: 50, hrAdmins: 2 },
  starter: { assessments: 20, groups: 10, participants: 200, hrAdmins: 5 },
  professional: { assessments: 100, groups: 50, participants: 1000, hrAdmins: 15 },
  enterprise: { assessments: -1, groups: -1, participants: -1, hrAdmins: -1 }, // -1 = unlimited
};

export interface UsageStats {
  assessments: number;
  groups: number;
  participants: number;
  hrAdmins: number;
}

export interface SubscriptionLimits {
  plan: string;
  limits: typeof PLAN_LIMITS[string];
  usage: UsageStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canCreate: (resource: "assessments" | "groups" | "participants" | "hrAdmins") => boolean;
  getRemainingCount: (resource: "assessments" | "groups" | "participants" | "hrAdmins") => number;
  getUsagePercentage: (resource: "assessments" | "groups" | "participants" | "hrAdmins") => number;
  isNearLimit: (resource: "assessments" | "groups" | "participants" | "hrAdmins") => boolean;
  organizationId: string | null;
}

export function useSubscriptionLimits(): SubscriptionLimits {
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [usage, setUsage] = useState<UsageStats>({
    assessments: 0,
    groups: 0,
    participants: 0,
    hrAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

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

      // Get organization plan
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("plan")
        .eq("id", profile.organization_id)
        .single();

      if (orgError) throw orgError;
      setPlan(org?.plan || "free");

      // Fetch all counts in parallel
      const [assessmentsRes, groupsRes, participantsRes, profilesRes] = await Promise.all([
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
    (resource: "assessments" | "groups" | "participants" | "hrAdmins"): boolean => {
      const limit = limits[resource];
      if (limit === -1) return true; // Unlimited
      return usage[resource] < limit;
    },
    [limits, usage]
  );

  const getRemainingCount = useCallback(
    (resource: "assessments" | "groups" | "participants" | "hrAdmins"): number => {
      const limit = limits[resource];
      if (limit === -1) return Infinity;
      return Math.max(0, limit - usage[resource]);
    },
    [limits, usage]
  );

  const getUsagePercentage = useCallback(
    (resource: "assessments" | "groups" | "participants" | "hrAdmins"): number => {
      const limit = limits[resource];
      if (limit === -1) return 0;
      return Math.min(100, (usage[resource] / limit) * 100);
    },
    [limits, usage]
  );

  const isNearLimit = useCallback(
    (resource: "assessments" | "groups" | "participants" | "hrAdmins"): boolean => {
      const percentage = getUsagePercentage(resource);
      return percentage >= 80;
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
