-- Add explicit DENY for anon on organization_email_settings
CREATE POLICY "Deny anonymous access to organization_email_settings"
  ON organization_email_settings
  FOR SELECT
  TO anon
  USING (false);