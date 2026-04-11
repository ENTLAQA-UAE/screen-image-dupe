-- ==============================================================================
-- Phase 1 Week 6 (completion): Auto-create trial subscription on new org
-- ==============================================================================
-- When a new organization is created, automatically give it a 14-day free
-- trial subscription. This ensures every org has an active subscription
-- record from day one — no edge cases where check_subscription_limit()
-- fails because there's no subscription row.
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.create_trial_subscription_for_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trial_plan_id UUID;
BEGIN
  -- Find the trial plan
  SELECT id INTO v_trial_plan_id
  FROM public.plans
  WHERE slug = 'free_trial' AND is_active = true
  LIMIT 1;

  IF v_trial_plan_id IS NULL THEN
    RAISE NOTICE 'No free_trial plan found — skipping auto trial for org %', NEW.id;
    RETURN NEW;
  END IF;

  -- Only create if no subscription exists yet (idempotent)
  INSERT INTO public.subscriptions (
    organization_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    trial_end,
    payment_method
  )
  VALUES (
    NEW.id,
    v_trial_plan_id,
    'trialing',
    'monthly',
    now(),
    now() + interval '14 days',
    now() + interval '14 days',
    'free_trial'
  )
  ON CONFLICT (organization_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach the trigger to organizations
DROP TRIGGER IF EXISTS trg_org_trial_subscription ON public.organizations;
CREATE TRIGGER trg_org_trial_subscription
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_subscription_for_org();

-- ==============================================================================
-- Trial expiration sweeper — transitions trialing → past_due when trial_end
-- has passed without payment. Intended to be called by a cron job
-- (pg_cron or Supabase scheduled function).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.expire_trial_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.subscriptions
  SET
    status = 'past_due',
    updated_at = now()
  WHERE status = 'trialing'
    AND trial_end IS NOT NULL
    AND trial_end < now()
    AND payment_method = 'free_trial';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_trial_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_trial_subscriptions() TO service_role;

COMMIT;

-- ==============================================================================
-- USAGE
-- ==============================================================================
-- 1. The trigger runs automatically on every organizations INSERT.
--    New signups get a 14-day trial subscription with no extra code.
--
-- 2. Schedule the expiration sweeper via Supabase Dashboard → Cron:
--      SELECT public.expire_trial_subscriptions();
--    Recommended frequency: every hour
--
-- 3. Or call it from a Next.js cron route (app/api/cron/expire-trials/route.ts)
--    protected by a CRON_SECRET header.
-- ==============================================================================
