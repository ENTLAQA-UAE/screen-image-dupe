import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SubscriptionData {
  id: string;
  status: string;            // 'trial' | 'active' | 'canceled' | 'expired' | 'past_due'
  plan_id: string;
  billing_cycle: string;
  trial_end: string | null;
  current_period_end: string;
  current_period_start: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: boolean | null;
  payment_method: string;
  plan: {
    name: string;
    slug: string;
    price_monthly_usd: number | null;
    price_annual_usd: number | null;
  } | null;
}

export interface SubscriptionState {
  subscription: SubscriptionData | null;
  organizationId: string | null;
  loading: boolean;
  error: string | null;

  // Computed helpers
  isTrial: boolean;
  isTrialExpired: boolean;
  isActive: boolean;
  isPaid: boolean;
  daysRemaining: number;
  planSlug: string;
  needsOnboarding: boolean;

  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const { user, isSuperAdmin } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // No org → needs onboarding (unless super admin)
      if (!profile?.organization_id) {
        setNeedsOnboarding(!isSuperAdmin());
        setLoading(false);
        return;
      }

      setOrganizationId(profile.organization_id);
      setNeedsOnboarding(false);

      // Fetch subscription with plan details
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          plan_id,
          billing_cycle,
          trial_end,
          current_period_end,
          current_period_start,
          stripe_customer_id,
          stripe_subscription_id,
          cancel_at_period_end,
          payment_method,
          plans (name, slug, price_monthly_usd, price_annual_usd)
        `)
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (subError) throw subError;

      if (sub) {
        setSubscription({
          ...sub,
          plan: sub.plans as SubscriptionData['plan'],
        });
      } else {
        // Org exists but no subscription record — treat as expired trial
        setSubscription(null);
      }
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message || 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Computed values
  const now = new Date();
  const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end) : null;
  const periodEnd = subscription ? new Date(subscription.current_period_end) : null;

  const isTrial = subscription?.status === 'trial';
  const isTrialExpired = isTrial && trialEnd ? trialEnd < now : false;
  const isActive = subscription?.status === 'active' || (isTrial && !isTrialExpired);
  const isPaid = subscription?.status === 'active' && subscription.payment_method === 'stripe';

  const daysRemaining = (() => {
    if (isTrial && trialEnd) {
      return Math.max(0, Math.floor((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
    if (periodEnd) {
      return Math.max(0, Math.floor((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
    return 0;
  })();

  const planSlug = subscription?.plan?.slug || 'free';

  return {
    subscription,
    organizationId,
    loading,
    error,
    isTrial,
    isTrialExpired,
    isActive,
    isPaid,
    daysRemaining,
    planSlug,
    needsOnboarding,
    refresh: fetchSubscription,
  };
}
