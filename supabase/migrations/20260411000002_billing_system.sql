-- ==============================================================================
-- Phase 1 Week 6: Billing system
-- ==============================================================================
-- Supports two payment paths:
--   1. Stripe online checkout (customer self-serve)
--   2. Manual activation for bank-transfer / invoice customers (super admin)
--
-- Super admin configures Stripe credentials via `payment_providers` table —
-- not via environment variables. This allows key rotation without redeploy.
--
-- All tables have RLS. Customers see only their own org; super admins see all.
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Plan catalog
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                -- 'starter', 'professional', 'enterprise', 'free_trial'
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,

  -- Pricing
  price_monthly_usd NUMERIC(10, 2),
  price_annual_usd NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Stripe mapping (one-time sync by super admin)
  stripe_product_id TEXT,
  stripe_price_monthly_id TEXT,
  stripe_price_annual_id TEXT,

  -- Limits (-1 means unlimited)
  max_assessments INTEGER DEFAULT 100,
  max_groups INTEGER DEFAULT 10,
  max_users INTEGER DEFAULT 5,
  max_organizations INTEGER DEFAULT 1,
  max_ai_questions_monthly INTEGER DEFAULT 100,

  -- Features (JSONB bag — free-form feature flags)
  features JSONB DEFAULT '{}'::jsonb,

  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,           -- false = enterprise plans only shown to admins
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plans_slug ON public.plans(slug) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_plans_sort ON public.plans(sort_order) WHERE is_active AND is_public;

-- -----------------------------------------------------------------------------
-- 2. Payment providers (super-admin managed credentials)
-- -----------------------------------------------------------------------------
-- Rows are singleton-per-provider-type (only one Stripe config at a time).
-- Credentials are stored encrypted via Supabase Vault helpers.
CREATE TABLE IF NOT EXISTS public.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL CHECK (provider_type IN ('stripe', 'lemon_squeezy', 'paddle', 'bank_transfer')),

  -- Stripe fields (also usable for other card processors)
  api_key_encrypted BYTEA,                  -- secret key (sk_live_...)
  webhook_secret_encrypted BYTEA,           -- whsec_...
  publishable_key TEXT,                     -- pk_live_... (safe to return to client)
  account_id TEXT,

  -- Bank transfer fields
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_iban TEXT,
  bank_swift TEXT,
  bank_currency TEXT DEFAULT 'USD',
  bank_instructions TEXT,                   -- free-form payment instructions (EN)
  bank_instructions_ar TEXT,                -- Arabic version

  -- Common
  is_active BOOLEAN DEFAULT false,          -- must be explicitly enabled
  is_test_mode BOOLEAN DEFAULT true,
  display_name TEXT,                        -- customer-facing label

  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(provider_type)
);

-- -----------------------------------------------------------------------------
-- 3. Subscriptions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),

  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused', 'pending_payment')),

  -- Billing cycle
  billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual')),

  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Payment method: distinguishes online Stripe from manual/offline
  payment_method TEXT NOT NULL DEFAULT 'free_trial'
    CHECK (payment_method IN ('stripe', 'bank_transfer', 'invoice', 'free_trial', 'complimentary')),

  -- Stripe-specific
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- Manual activation audit trail
  manually_activated_by UUID REFERENCES auth.users(id),
  manually_activated_at TIMESTAMPTZ,
  manual_activation_notes TEXT,
  bank_transfer_reference TEXT,             -- transaction ref, date, amount

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. Invoices (unified for Stripe + manual)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,

  invoice_number TEXT UNIQUE NOT NULL,      -- QUD-2026-0001 format
  amount_usd NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  tax_amount NUMERIC(10, 2) DEFAULT 0,      -- MENA VAT

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible', 'pending_transfer')),

  payment_method TEXT NOT NULL,
  stripe_invoice_id TEXT,
  stripe_hosted_url TEXT,
  pdf_url TEXT,

  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- For bank transfer invoices
  bank_transfer_reference TEXT,
  bank_transfer_confirmed_at TIMESTAMPTZ,
  bank_transfer_confirmed_by UUID REFERENCES auth.users(id),

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Invoice number auto-generation
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    year_part := to_char(now(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.invoices
    WHERE invoice_number LIKE 'QUD-' || year_part || '-%';
    NEW.invoice_number := 'QUD-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_number ON public.invoices;
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

-- -----------------------------------------------------------------------------
-- 5. Bank transfer requests (customer-initiated, admin-processed)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),

  plan_id UUID NOT NULL REFERENCES public.plans(id),
  billing_cycle TEXT NOT NULL DEFAULT 'annual' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount_usd NUMERIC(10, 2) NOT NULL,
  company_name TEXT NOT NULL,
  company_vat_number TEXT,
  billing_email TEXT NOT NULL,
  billing_address TEXT,
  notes TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_payment', 'paid_confirmed', 'rejected', 'cancelled')),

  -- Admin workflow
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  proforma_invoice_id UUID REFERENCES public.invoices(id),
  activated_subscription_id UUID REFERENCES public.subscriptions(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_btr_status ON public.bank_transfer_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_btr_org ON public.bank_transfer_requests(organization_id);

-- -----------------------------------------------------------------------------
-- 6. Usage records (metered billing + limit enforcement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,                     -- 'ai_question_generated', 'assessment_created', 'email_sent'
  quantity INTEGER NOT NULL DEFAULT 1,
  period_month DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_org_period ON public.usage_records(organization_id, period_month, metric);

-- -----------------------------------------------------------------------------
-- 7. Seed: Default plans
-- -----------------------------------------------------------------------------
INSERT INTO public.plans (slug, name, name_ar, description, description_ar, price_monthly_usd, price_annual_usd, max_assessments, max_groups, max_users, max_organizations, max_ai_questions_monthly, features, sort_order)
VALUES
  (
    'free_trial',
    'Free Trial',
    'تجربة مجانية',
    '14-day trial with full Professional features',
    'تجربة مجانية لمدة 14 يوماً مع جميع ميزات الباقة الاحترافية',
    0, 0,
    100, 5, 3, 1, 100,
    '{"trial_days": 14, "basic_branding": true, "basic_reports": true}'::jsonb,
    0
  ),
  (
    'starter',
    'Starter',
    'المبتدئ',
    'For small teams starting with structured assessments',
    'للفرق الصغيرة التي تبدأ بتقييمات منظمة',
    349, 3490,
    500, 50, 5, 1, 100,
    '{"basic_branding": true, "basic_reports": true, "email_support": true, "all_assessment_types": true}'::jsonb,
    1
  ),
  (
    'professional',
    'Professional',
    'الاحترافية',
    'For growing organizations with advanced needs',
    'للمؤسسات النامية ذات الاحتياجات المتقدمة',
    999, 9990,
    -1, -1, 25, 3, 1000,
    '{"full_branding": true, "white_label": true, "custom_domain": true, "byok_email": true, "byok_ai": true, "advanced_proctoring": true, "api_read": true, "chat_support": true, "ai_narratives": true}'::jsonb,
    2
  ),
  (
    'enterprise',
    'Enterprise',
    'المؤسسات',
    'For enterprises with complex compliance needs',
    'للمؤسسات الكبيرة ذات الاحتياجات المعقدة',
    NULL, NULL,
    -1, -1, -1, 10, -1,
    '{"unlimited_everything": true, "video_interviews": true, "skills_passport": true, "native_integrations": true, "full_api": true, "sso": true, "soc2": true, "dpa": true, "data_residency": true, "dedicated_csm": true, "sla_9995": true}'::jsonb,
    3
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 8. Backfill: give existing orgs a trial subscription
-- -----------------------------------------------------------------------------
INSERT INTO public.subscriptions (organization_id, plan_id, status, payment_method, trial_end)
SELECT
  o.id,
  (SELECT id FROM public.plans WHERE slug = 'free_trial' LIMIT 1),
  'trialing',
  'free_trial',
  now() + interval '14 days'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.organization_id = o.id
);

-- -----------------------------------------------------------------------------
-- 9. Subscription limit enforcement
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_subscription_limit(
  p_org_id UUID,
  p_resource TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count BIGINT;
  v_max_allowed INTEGER;
  v_plan_id UUID;
BEGIN
  -- Get the active plan for this org
  SELECT plan_id INTO v_plan_id
  FROM public.subscriptions
  WHERE organization_id = p_org_id
    AND status IN ('active', 'trialing', 'past_due')
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN FALSE; -- No active subscription
  END IF;

  -- Get the limit for this resource
  SELECT CASE p_resource
    WHEN 'assessments' THEN max_assessments
    WHEN 'groups' THEN max_groups
    WHEN 'users' THEN max_users
    WHEN 'organizations' THEN max_organizations
    WHEN 'ai_questions' THEN max_ai_questions_monthly
    ELSE 0
  END INTO v_max_allowed
  FROM public.plans
  WHERE id = v_plan_id;

  -- -1 means unlimited
  IF v_max_allowed = -1 THEN
    RETURN TRUE;
  END IF;

  -- Count current usage
  IF p_resource = 'assessments' THEN
    SELECT COUNT(*) INTO v_current_count FROM public.assessments WHERE organization_id = p_org_id;
  ELSIF p_resource = 'groups' THEN
    SELECT COUNT(*) INTO v_current_count FROM public.assessment_groups WHERE organization_id = p_org_id;
  ELSIF p_resource = 'ai_questions' THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_current_count
    FROM public.usage_records
    WHERE organization_id = p_org_id
      AND metric = 'ai_question_generated'
      AND period_month = date_trunc('month', now())::date;
  ELSE
    v_current_count := 0;
  END IF;

  RETURN v_current_count < v_max_allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.check_subscription_limit(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_subscription_limit(UUID, TEXT) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 10. RLS Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- Plans: readable by all authenticated users
DROP POLICY IF EXISTS "Plans readable by authenticated" ON public.plans;
CREATE POLICY "Plans readable by authenticated"
  ON public.plans FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Plans managed by super admin" ON public.plans;
CREATE POLICY "Plans managed by super admin"
  ON public.plans FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Payment providers: super admin only (never expose secrets to anyone else)
DROP POLICY IF EXISTS "Payment providers super admin only" ON public.payment_providers;
CREATE POLICY "Payment providers super admin only"
  ON public.payment_providers FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Subscriptions: org admins see their own, super admins see all
DROP POLICY IF EXISTS "Subscriptions viewable by org admins" ON public.subscriptions;
CREATE POLICY "Subscriptions viewable by org admins"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  );

DROP POLICY IF EXISTS "Subscriptions managed by super admin" ON public.subscriptions;
CREATE POLICY "Subscriptions managed by super admin"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Invoices: same pattern
DROP POLICY IF EXISTS "Invoices viewable by org admins" ON public.invoices;
CREATE POLICY "Invoices viewable by org admins"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  );

DROP POLICY IF EXISTS "Invoices managed by super admin" ON public.invoices;
CREATE POLICY "Invoices managed by super admin"
  ON public.invoices FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Bank transfer requests: org admins can create and view own, super admins see all
DROP POLICY IF EXISTS "Bank transfer requests viewable by org admins" ON public.bank_transfer_requests;
CREATE POLICY "Bank transfer requests viewable by org admins"
  ON public.bank_transfer_requests FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  );

DROP POLICY IF EXISTS "Bank transfer requests creatable by org admins" ON public.bank_transfer_requests;
CREATE POLICY "Bank transfer requests creatable by org admins"
  ON public.bank_transfer_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id() AND is_org_admin()
  );

DROP POLICY IF EXISTS "Bank transfer requests managed by super admin" ON public.bank_transfer_requests;
CREATE POLICY "Bank transfer requests managed by super admin"
  ON public.bank_transfer_requests FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Usage records: org admins see own, service_role writes
DROP POLICY IF EXISTS "Usage records viewable by org" ON public.usage_records;
CREATE POLICY "Usage records viewable by org"
  ON public.usage_records FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR organization_id = get_user_organization_id()
  );

-- -----------------------------------------------------------------------------
-- 11. Seed: bank transfer provider (super admin fills details later)
-- -----------------------------------------------------------------------------
INSERT INTO public.payment_providers (provider_type, display_name, is_active, bank_currency)
VALUES ('bank_transfer', 'Bank Transfer', false, 'USD')
ON CONFLICT (provider_type) DO NOTHING;

INSERT INTO public.payment_providers (provider_type, display_name, is_active)
VALUES ('stripe', 'Stripe', false)
ON CONFLICT (provider_type) DO NOTHING;

COMMIT;

-- ==============================================================================
-- POST-MIGRATION NOTES
-- ==============================================================================
-- 1. Super admin must configure Stripe via /admin/billing/providers
--    (stores sk_live and whsec via Vault)
-- 2. Super admin must fill bank details via /admin/billing/providers
-- 3. Existing organizations have been given a free trial subscription
-- 4. To grant a complimentary lifetime plan to a specific org:
--      UPDATE subscriptions SET payment_method = 'complimentary',
--        current_period_end = '2099-12-31', status = 'active'
--      WHERE organization_id = '...';
-- ==============================================================================
