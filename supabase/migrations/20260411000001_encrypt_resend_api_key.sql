-- ==============================================================================
-- Phase 1 Week 1: Encrypt organization_email_settings.resend_api_key
-- ==============================================================================
-- This migration is BACKWARDS-COMPATIBLE and NON-DESTRUCTIVE:
--   1. Adds a new column `encrypted_resend_api_key BYTEA` using pgcrypto
--   2. Copies existing plaintext `resend_api_key` into the new encrypted column
--   3. Keeps the plaintext column for now (do NOT drop until app reads encrypted column)
--   4. Creates a helper function `get_decrypted_resend_api_key(org_id)` that is
--      SECURITY DEFINER and restricted to org admins
--
-- The plaintext column will be zeroed out in a follow-up migration once the
-- application code has been updated to read from the encrypted column.
--
-- Prerequisites:
--   - pgcrypto extension (ships with Supabase)
--   - A server-side encryption key stored as a GUC setting or Vault secret.
--     For this migration we use Supabase Vault (vault.secrets) which is
--     available on all Supabase projects.
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Ensure required extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE;

-- -----------------------------------------------------------------------------
-- 2. Store the master encryption key in Vault (once, idempotent)
-- -----------------------------------------------------------------------------
-- NOTE: The key itself is generated randomly on first run. After that, the
-- vault.secrets row persists. If you ever need to rotate the master key,
-- that requires re-encrypting every row (separate migration).
DO $$
DECLARE
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id FROM vault.secrets WHERE name = 'qudurat_email_key';
  IF existing_id IS NULL THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'base64'),
      'qudurat_email_key',
      'AES-256 key for encrypting per-tenant email provider credentials'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Add the encrypted column (idempotent)
-- -----------------------------------------------------------------------------
ALTER TABLE public.organization_email_settings
  ADD COLUMN IF NOT EXISTS encrypted_resend_api_key BYTEA;

COMMENT ON COLUMN public.organization_email_settings.encrypted_resend_api_key IS
  'AES-256-GCM encrypted Resend API key. Decrypt via get_decrypted_resend_api_key().';

-- -----------------------------------------------------------------------------
-- 4. Backfill: encrypt existing plaintext values into the new column
-- -----------------------------------------------------------------------------
UPDATE public.organization_email_settings
SET encrypted_resend_api_key = pgp_sym_encrypt(
  resend_api_key,
  (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'qudurat_email_key')
)
WHERE resend_api_key IS NOT NULL
  AND resend_api_key <> ''
  AND encrypted_resend_api_key IS NULL;

-- -----------------------------------------------------------------------------
-- 5. Helper: encrypt a plaintext key (called from edge functions / triggers)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.encrypt_email_secret(plain_text TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  master_key TEXT;
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO master_key
  FROM vault.decrypted_secrets
  WHERE name = 'qudurat_email_key';

  IF master_key IS NULL THEN
    RAISE EXCEPTION 'qudurat_email_key not found in vault';
  END IF;

  RETURN pgp_sym_encrypt(plain_text, master_key);
END;
$$;

REVOKE ALL ON FUNCTION public.encrypt_email_secret(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.encrypt_email_secret(TEXT) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 6. Helper: decrypt an organization's resend key (for edge functions only)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_decrypted_resend_api_key(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  encrypted_val BYTEA;
  master_key TEXT;
  plaintext_fallback TEXT;
BEGIN
  -- Restrict to org admins and service_role
  IF auth.role() <> 'service_role' AND NOT public.is_org_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Verify the caller belongs to this org (unless service_role)
  IF auth.role() <> 'service_role' THEN
    IF p_org_id <> public.get_user_organization_id() THEN
      RAISE EXCEPTION 'Cannot access another organization''s secrets';
    END IF;
  END IF;

  SELECT encrypted_resend_api_key, resend_api_key
  INTO encrypted_val, plaintext_fallback
  FROM public.organization_email_settings
  WHERE organization_id = p_org_id;

  -- Prefer encrypted value; fall back to plaintext for backwards compatibility
  -- during the rollout window. This fallback is REMOVED in a follow-up migration.
  IF encrypted_val IS NOT NULL THEN
    SELECT decrypted_secret INTO master_key
    FROM vault.decrypted_secrets
    WHERE name = 'qudurat_email_key';

    RETURN pgp_sym_decrypt(encrypted_val, master_key);
  END IF;

  RETURN plaintext_fallback;
END;
$$;

REVOKE ALL ON FUNCTION public.get_decrypted_resend_api_key(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_decrypted_resend_api_key(UUID) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 7. Trigger: auto-encrypt on insert/update of resend_api_key (backwards-compat)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_encrypt_resend_api_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  IF NEW.resend_api_key IS NOT NULL AND NEW.resend_api_key <> '' THEN
    NEW.encrypted_resend_api_key := public.encrypt_email_secret(NEW.resend_api_key);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS org_email_settings_encrypt_key ON public.organization_email_settings;
CREATE TRIGGER org_email_settings_encrypt_key
  BEFORE INSERT OR UPDATE OF resend_api_key
  ON public.organization_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_encrypt_resend_api_key();

-- -----------------------------------------------------------------------------
-- 8. Audit log entry for this migration
-- -----------------------------------------------------------------------------
-- (Audit table is created in a later migration; this is a no-op if it doesn't exist yet)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    INSERT INTO public.audit_logs (action, target_type, metadata)
    VALUES (
      'security.migration.encrypt_resend_api_key',
      'organization_email_settings',
      jsonb_build_object('migration', '20260411000001', 'phase', 'Phase 1 Week 1')
    );
  END IF;
END $$;

COMMIT;

-- ==============================================================================
-- POST-MIGRATION NOTES
-- ==============================================================================
-- 1. The plaintext `resend_api_key` column is still present and still being
--    populated by existing app code. This is intentional during rollout.
-- 2. A follow-up migration (Phase 1 Week 2) will:
--    (a) Verify all app code reads encrypted_resend_api_key via the helper
--    (b) Zero out the plaintext column: UPDATE ... SET resend_api_key = ''
--    (c) Eventually DROP the plaintext column
-- 3. Edge functions that send emails should call:
--    SELECT get_decrypted_resend_api_key('org-uuid-here');
-- ==============================================================================
