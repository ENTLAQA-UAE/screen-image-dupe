-- ==============================================================================
-- Phase 2 Week 8: Tenant AI Provider System
-- ==============================================================================
-- Each tenant configures their own AI provider (OpenAI, Anthropic, Gemini,
-- etc.) for question generation, narrative reports, and talent snapshots.
-- BYOK model — tenant pays their AI provider directly.
--
-- Credentials are encrypted via Supabase Vault (same as email providers).
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Tenant AI providers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL CHECK (provider_type IN (
    'openai', 'anthropic', 'gemini', 'azure_openai',
    'groq', 'deepseek', 'mistral', 'ollama', 'custom'
  )),
  display_name TEXT,
  is_primary BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,

  -- Credentials (encrypted via Vault)
  encrypted_api_key BYTEA,
  base_url TEXT,                          -- For Azure, Ollama, custom endpoints
  organization_header TEXT,               -- OpenAI org header (optional)

  -- Model routing per use case
  default_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  question_gen_model TEXT,                -- Override for question generation
  narrative_model TEXT,                   -- Override for narrative reports
  snapshot_model TEXT,                    -- Override for talent snapshots

  -- Generation parameters
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  top_p NUMERIC(3,2) DEFAULT 1.0,

  -- Cost controls
  monthly_token_cap BIGINT,               -- NULL = unlimited
  monthly_cost_cap_usd NUMERIC(10,2),     -- NULL = unlimited

  -- Test status
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT CHECK (last_test_status IN ('success', 'failed') OR last_test_status IS NULL),
  last_test_error TEXT,
  last_test_latency_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, provider_type)
);

CREATE INDEX IF NOT EXISTS idx_tap_org ON public.tenant_ai_providers(organization_id);

-- Ensure only one primary per org
CREATE OR REPLACE FUNCTION public.enforce_single_primary_ai_provider()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.tenant_ai_providers
    SET is_primary = false
    WHERE organization_id = NEW.organization_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_primary_ai ON public.tenant_ai_providers;
CREATE TRIGGER trg_single_primary_ai
  BEFORE INSERT OR UPDATE OF is_primary
  ON public.tenant_ai_providers
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.enforce_single_primary_ai_provider();

-- -----------------------------------------------------------------------------
-- 2. AI usage tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.tenant_ai_providers(id) ON DELETE SET NULL,

  use_case TEXT NOT NULL,                 -- 'question_generation', 'narrative', 'snapshot', 'group_insights', 'test'
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  cost_estimate_usd NUMERIC(10,6),
  latency_ms INTEGER,

  metadata JSONB DEFAULT '{}',            -- assessment_id, group_id, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tau_org_month ON public.tenant_ai_usage(
  organization_id,
  (date_trunc('month', created_at))
);
CREATE INDEX IF NOT EXISTS idx_tau_use_case ON public.tenant_ai_usage(organization_id, use_case);

-- -----------------------------------------------------------------------------
-- 3. Default prompt templates (seed data, org can override later)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  use_case TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  template_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- NULL organization_id = platform default (used as fallback)
  UNIQUE(organization_id, use_case, language)
);

-- Seed platform defaults (organization_id = NULL)
INSERT INTO public.tenant_prompt_templates (organization_id, use_case, language, template_text, variables)
VALUES
  (NULL, 'question_generation', 'en',
   'Generate {questionCount} assessment questions about: {description}. Type: {assessmentType}. Difficulty: {difficulty}.',
   '["questionCount", "description", "assessmentType", "difficulty"]'::jsonb),
  (NULL, 'question_generation', 'ar',
   'أنشئ {questionCount} أسئلة تقييم حول: {description}. النوع: {assessmentType}. الصعوبة: {difficulty}.',
   '["questionCount", "description", "assessmentType", "difficulty"]'::jsonb),
  (NULL, 'narrative', 'en',
   'Generate a professional assessment narrative report for a group of {participantCount} participants who completed "{assessmentTitle}". Include strengths, areas for development, and recommendations.',
   '["participantCount", "assessmentTitle"]'::jsonb),
  (NULL, 'narrative', 'ar',
   'أنشئ تقرير سردي احترافي لمجموعة من {participantCount} مشارك أكملوا تقييم "{assessmentTitle}". اذكر نقاط القوة ومجالات التطوير والتوصيات.',
   '["participantCount", "assessmentTitle"]'::jsonb),
  (NULL, 'snapshot', 'en',
   'Generate a comprehensive talent snapshot for an employee based on their {assessmentCount} completed assessments. Include personality traits, cognitive strengths, behavioral patterns, and career recommendations.',
   '["assessmentCount"]'::jsonb),
  (NULL, 'snapshot', 'ar',
   'أنشئ لقطة شاملة للمواهب لموظف بناءً على {assessmentCount} تقييم مكتمل. اذكر السمات الشخصية والقوى المعرفية والأنماط السلوكية والتوصيات المهنية.',
   '["assessmentCount"]'::jsonb)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Helper: check monthly AI usage against cap
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_ai_usage_cap(
  p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_cap BIGINT;
  v_cost_cap NUMERIC(10,2);
  v_current_tokens BIGINT;
  v_current_cost NUMERIC(10,2);
BEGIN
  SELECT monthly_token_cap, monthly_cost_cap_usd
  INTO v_token_cap, v_cost_cap
  FROM public.tenant_ai_providers
  WHERE organization_id = p_org_id AND is_active = true AND is_primary = true
  LIMIT 1;

  -- No caps set = unlimited
  IF v_token_cap IS NULL AND v_cost_cap IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check token cap
  IF v_token_cap IS NOT NULL THEN
    SELECT COALESCE(SUM(total_tokens), 0) INTO v_current_tokens
    FROM public.tenant_ai_usage
    WHERE organization_id = p_org_id
      AND created_at >= date_trunc('month', now());

    IF v_current_tokens >= v_token_cap THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Check cost cap
  IF v_cost_cap IS NOT NULL THEN
    SELECT COALESCE(SUM(cost_estimate_usd), 0) INTO v_current_cost
    FROM public.tenant_ai_usage
    WHERE organization_id = p_org_id
      AND created_at >= date_trunc('month', now());

    IF v_current_cost >= v_cost_cap THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.check_ai_usage_cap(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_ai_usage_cap(UUID) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 5. RLS Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.tenant_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_prompt_templates ENABLE ROW LEVEL SECURITY;

-- AI providers: org admins manage their own
DROP POLICY IF EXISTS "Org admins manage AI providers" ON public.tenant_ai_providers;
CREATE POLICY "Org admins manage AI providers"
  ON public.tenant_ai_providers FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  )
  WITH CHECK (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  );

-- Usage: org members can view, service_role inserts
DROP POLICY IF EXISTS "Org members view AI usage" ON public.tenant_ai_usage;
CREATE POLICY "Org members view AI usage"
  ON public.tenant_ai_usage FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR organization_id = get_user_organization_id()
  );

DROP POLICY IF EXISTS "Authenticated insert AI usage" ON public.tenant_ai_usage;
CREATE POLICY "Authenticated insert AI usage"
  ON public.tenant_ai_usage FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

-- Prompt templates: readable by org, platform defaults readable by all
DROP POLICY IF EXISTS "Read prompt templates" ON public.tenant_prompt_templates;
CREATE POLICY "Read prompt templates"
  ON public.tenant_prompt_templates FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL  -- platform defaults
    OR organization_id = get_user_organization_id()
    OR is_super_admin()
  );

DROP POLICY IF EXISTS "Org admins manage prompt templates" ON public.tenant_prompt_templates;
CREATE POLICY "Org admins manage prompt templates"
  ON public.tenant_prompt_templates FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  )
  WITH CHECK (
    is_super_admin()
    OR (organization_id = get_user_organization_id() AND is_org_admin())
  );

COMMIT;
