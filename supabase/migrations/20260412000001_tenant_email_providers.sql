-- ==============================================================================
-- Phase 2 Week 7: Tenant Email Provider System
-- ==============================================================================
-- Each tenant can configure their own email provider (Resend, Mailgun,
-- SendGrid, Amazon SES, Postmark, or direct SMTP). Credentials are encrypted
-- via Supabase Vault. Org admin manages from /settings/email.
--
-- Also creates the email_logs table for delivery tracking.
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Tenant email providers (per-org, multiple allowed, one primary)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_email_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL CHECK (provider_type IN (
    'resend', 'mailgun', 'sendgrid', 'ses', 'postmark', 'smtp'
  )),
  display_name TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Sender identity
  from_email TEXT NOT NULL,
  from_name TEXT,
  reply_to TEXT,

  -- Encrypted credentials (via Vault helper)
  -- For API-based: api_key
  -- For SMTP: username + password
  encrypted_api_key BYTEA,

  -- SMTP-specific fields (only used when provider_type = 'smtp')
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT true,
  smtp_username TEXT,
  encrypted_smtp_password BYTEA,

  -- Provider-specific fields
  -- Mailgun: domain required
  -- SES: region required
  -- SendGrid: no extra fields
  provider_domain TEXT,          -- Mailgun domain
  provider_region TEXT,          -- SES region (us-east-1, eu-west-1, etc.)

  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT CHECK (last_test_status IN ('success', 'failed') OR last_test_status IS NULL),
  last_test_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One provider type per org (can upgrade later to allow multiples)
  UNIQUE(organization_id, provider_type)
);

CREATE INDEX IF NOT EXISTS idx_tep_org ON public.tenant_email_providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_tep_primary ON public.tenant_email_providers(organization_id) WHERE is_primary = true;

-- Ensure only one primary per org
CREATE OR REPLACE FUNCTION public.enforce_single_primary_email_provider()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.tenant_email_providers
    SET is_primary = false
    WHERE organization_id = NEW.organization_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_primary_email ON public.tenant_email_providers;
CREATE TRIGGER trg_single_primary_email
  BEFORE INSERT OR UPDATE OF is_primary
  ON public.tenant_email_providers
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.enforce_single_primary_email_provider();

-- -----------------------------------------------------------------------------
-- 2. Email send logs (delivery tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.tenant_email_providers(id) ON DELETE SET NULL,

  -- Message details
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_key TEXT,              -- e.g., 'invite', 'reminder', 'welcome'

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'sent', 'delivered', 'bounced', 'complained', 'failed'
  )),
  error_message TEXT,
  provider_message_id TEXT,       -- ID returned by the email provider

  -- Metadata
  metadata JSONB DEFAULT '{}',    -- template variables, assessment info, etc.

  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tel_org ON public.tenant_email_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tel_status ON public.tenant_email_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tel_template ON public.tenant_email_logs(organization_id, template_key);

-- -----------------------------------------------------------------------------
-- 3. RLS Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.tenant_email_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_email_logs ENABLE ROW LEVEL SECURITY;

-- Providers: org admins can manage their own
DROP POLICY IF EXISTS "Org admins manage email providers" ON public.tenant_email_providers;
CREATE POLICY "Org admins manage email providers"
  ON public.tenant_email_providers FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  )
  WITH CHECK (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  );

-- Logs: org admins can view their own, service_role can insert
DROP POLICY IF EXISTS "Org admins view email logs" ON public.tenant_email_logs;
CREATE POLICY "Org admins view email logs"
  ON public.tenant_email_logs FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  );

-- Service role can insert logs (from Server Actions / cron jobs)
DROP POLICY IF EXISTS "Service role inserts email logs" ON public.tenant_email_logs;
CREATE POLICY "Service role inserts email logs"
  ON public.tenant_email_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also allow authenticated users to insert (for Server Actions running as user)
DROP POLICY IF EXISTS "Authenticated insert email logs" ON public.tenant_email_logs;
CREATE POLICY "Authenticated insert email logs"
  ON public.tenant_email_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
  );

-- -----------------------------------------------------------------------------
-- 4. Migrate existing Resend config from organization_email_settings
-- -----------------------------------------------------------------------------
-- If the tenant already has Resend configured in the old table, copy it over.
-- This is a one-time backfill.
INSERT INTO public.tenant_email_providers (
  organization_id, provider_type, display_name, is_primary, is_active,
  from_email, from_name, encrypted_api_key
)
SELECT
  oes.organization_id,
  'resend',
  'Resend (migrated)',
  true,
  true,
  COALESCE(oes.from_email, 'hello@' || o.name || '.com'),
  COALESCE(oes.from_name, o.name),
  oes.encrypted_resend_api_key
FROM public.organization_email_settings oes
JOIN public.organizations o ON o.id = oes.organization_id
WHERE oes.encrypted_resend_api_key IS NOT NULL
ON CONFLICT (organization_id, provider_type) DO NOTHING;

COMMIT;
