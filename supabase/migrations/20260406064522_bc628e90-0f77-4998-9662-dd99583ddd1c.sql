
-- 1. Fix email_settings policies: change from {public} to {authenticated}
DROP POLICY IF EXISTS "Only admins can view email settings" ON organization_email_settings;
DROP POLICY IF EXISTS "Org admins can insert their email settings" ON organization_email_settings;
DROP POLICY IF EXISTS "Org admins can update their email settings" ON organization_email_settings;

CREATE POLICY "Only admins can view email settings"
  ON organization_email_settings FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id() AND (is_org_admin() OR is_super_admin()));

CREATE POLICY "Org admins can insert their email settings"
  ON organization_email_settings FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id() AND (is_org_admin() OR is_super_admin()));

CREATE POLICY "Org admins can update their email settings"
  ON organization_email_settings FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id() AND (is_org_admin() OR is_super_admin()));

-- 2. Fix storage policies: add is_org_admin() check
DROP POLICY IF EXISTS "Org admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can delete logos" ON storage.objects;

CREATE POLICY "Org admins can upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND is_org_admin()
    AND (storage.foldername(name))[1] IN (
      SELECT organizations.id::text FROM organizations
      WHERE organizations.id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    )
  );

CREATE POLICY "Org admins can update logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND is_org_admin()
    AND (storage.foldername(name))[1] IN (
      SELECT organizations.id::text FROM organizations
      WHERE organizations.id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    )
  );

CREATE POLICY "Org admins can delete logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND is_org_admin()
    AND (storage.foldername(name))[1] IN (
      SELECT organizations.id::text FROM organizations
      WHERE organizations.id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    )
  );
