-- Fix 1: Assessments INSERT policy - restrict to authenticated only
DROP POLICY IF EXISTS "admins_create_assessments_for_own_org" ON assessments;
CREATE POLICY "admins_create_assessments_for_own_org"
  ON assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

-- Fix 2: Email templates SELECT - restrict to admins only
DROP POLICY IF EXISTS "Org admins can view their email templates" ON email_templates;
CREATE POLICY "Org admins can view their email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND (is_org_admin() OR is_hr_admin() OR is_super_admin())
  );

-- Fix 3: Trigger to enforce safe defaults on participant anonymous inserts
CREATE OR REPLACE FUNCTION public.sanitize_participant_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If not authenticated (anonymous insert), enforce safe defaults
  IF auth.uid() IS NULL THEN
    NEW.status := 'started';
    NEW.score_summary := NULL;
    NEW.ai_report_text := NULL;
    NEW.completed_at := NULL;
    NEW.submission_type := 'normal';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sanitize_participant_insert_trigger
  BEFORE INSERT ON participants
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_participant_insert();