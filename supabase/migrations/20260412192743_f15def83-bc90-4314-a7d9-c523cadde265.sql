
-- 1. Remove notifications from realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;

-- 2. Drop trigger that depends on resend_api_key, then drop column, then recreate trigger
DROP TRIGGER IF EXISTS org_email_settings_encrypt_key ON public.organization_email_settings;

ALTER TABLE public.organization_email_settings DROP COLUMN IF EXISTS resend_api_key;

-- Recreate the trigger function to not reference the dropped column
CREATE OR REPLACE FUNCTION public.trg_encrypt_resend_api_key()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'vault'
AS $$
BEGIN
  -- No-op: plaintext column removed; encryption now handled at application/edge-function level
  RETURN NEW;
END;
$$;

-- 3. Fix function search paths
CREATE OR REPLACE FUNCTION public.enforce_single_primary_ai_provider()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.enforce_single_primary_email_provider()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $$
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
$$;
