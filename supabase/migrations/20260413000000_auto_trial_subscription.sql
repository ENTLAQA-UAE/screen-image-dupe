-- Auto-create a 14-day trial subscription when an organization is created.
-- Uses the 'free' plan from the plans table as the trial plan.

CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Find the free plan (fallback to any plan if 'free' doesn't exist)
  SELECT id INTO free_plan_id
  FROM public.plans
  WHERE slug = 'free' AND is_active = true
  LIMIT 1;

  -- Only create subscription if we found a plan
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (
      organization_id,
      plan_id,
      status,
      billing_cycle,
      payment_method,
      current_period_start,
      current_period_end,
      trial_end
    ) VALUES (
      NEW.id,
      free_plan_id,
      'trial',
      'monthly',
      'free_trial',
      now(),
      now() + interval '14 days',
      now() + interval '14 days'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();
