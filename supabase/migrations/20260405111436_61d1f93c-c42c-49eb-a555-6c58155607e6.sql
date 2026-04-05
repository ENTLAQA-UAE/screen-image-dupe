-- Fix 1: Anonymous participant INSERT policy - enforce organization_id consistency
DROP POLICY IF EXISTS "Anonymous can register via valid group link" ON participants;
CREATE POLICY "Anonymous can register via valid group link"
  ON participants
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessment_groups ag
      WHERE ag.id = participants.group_id
        AND ag.is_active = true
        AND (ag.start_date IS NULL OR ag.start_date <= now())
        AND (ag.end_date IS NULL OR ag.end_date >= now())
        AND ag.organization_id = participants.organization_id
    )
  );

-- Fix 2: Restrict org admins from escalating roles
-- They should only be able to assign hr_admin, not org_admin or super_admin
DROP POLICY IF EXISTS "Org admins can manage roles for their org users" ON user_roles;
CREATE POLICY "Org admins can manage roles for their org users"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    is_org_admin(auth.uid()) 
    AND role = 'hr_admin'
    AND user_id IN (
      SELECT profiles.id FROM profiles
      WHERE profiles.organization_id IN (
        SELECT p2.organization_id FROM profiles p2 WHERE p2.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    is_org_admin(auth.uid())
    AND role = 'hr_admin'
    AND user_id IN (
      SELECT profiles.id FROM profiles
      WHERE profiles.organization_id IN (
        SELECT p2.organization_id FROM profiles p2 WHERE p2.id = auth.uid()
      )
    )
  );