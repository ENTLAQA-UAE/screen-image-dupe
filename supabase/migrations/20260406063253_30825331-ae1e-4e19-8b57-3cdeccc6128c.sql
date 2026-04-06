
-- 1. Remove the anonymous INSERT policy on participants (registration goes through edge function with service role key)
DROP POLICY IF EXISTS "Anonymous can register via valid group link" ON participants;

-- 2. Fix privilege escalation: Split org admin ALL policy into specific INSERT/DELETE/SELECT policies
DROP POLICY IF EXISTS "Org admins can manage roles for their org users" ON user_roles;

CREATE POLICY "Org admins can insert hr_admin roles for their org users"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_admin(auth.uid())
    AND role = 'hr_admin'::app_role
    AND user_id IN (
      SELECT profiles.id FROM profiles
      WHERE profiles.organization_id IN (
        SELECT p2.organization_id FROM profiles p2 WHERE p2.id = auth.uid()
      )
    )
  );

CREATE POLICY "Org admins can delete hr_admin roles for their org users"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    is_org_admin(auth.uid())
    AND role = 'hr_admin'::app_role
    AND user_id IN (
      SELECT profiles.id FROM profiles
      WHERE profiles.organization_id IN (
        SELECT p2.organization_id FROM profiles p2 WHERE p2.id = auth.uid()
      )
    )
  );

-- 3. Restrict organizations UPDATE to admins only
DROP POLICY IF EXISTS "Org admins can update their organization" ON organizations;

CREATE POLICY "Org admins can update their organization"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND (is_org_admin() OR is_super_admin())
  )
  WITH CHECK (
    id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND (is_org_admin() OR is_super_admin())
  );
