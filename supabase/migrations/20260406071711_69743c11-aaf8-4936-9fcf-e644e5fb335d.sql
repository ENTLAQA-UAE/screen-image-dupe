
-- =============================================
-- 1. PARTICIPANTS: Restrict to admin roles only
-- =============================================
DROP POLICY IF EXISTS "Org members can manage their participants" ON participants;

-- Admins can SELECT participants in their org
CREATE POLICY "Admins can view their org participants"
  ON participants FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND (is_org_admin() OR is_hr_admin())
  );

-- Admins can INSERT participants in their org
CREATE POLICY "Admins can insert their org participants"
  ON participants FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND (is_org_admin() OR is_hr_admin())
  );

-- Admins can UPDATE participants in their org
CREATE POLICY "Admins can update their org participants"
  ON participants FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND (is_org_admin() OR is_hr_admin())
  )
  WITH CHECK (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND (is_org_admin() OR is_hr_admin())
  );

-- Admins can DELETE participants in their org
CREATE POLICY "Admins can delete their org participants"
  ON participants FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND (is_org_admin() OR is_hr_admin())
  );

-- =============================================
-- 2. RESPONSES: Restrict to admin roles only
-- =============================================
DROP POLICY IF EXISTS "Org members can view responses for their participants" ON responses;
DROP POLICY IF EXISTS "Org members can insert responses for their participants" ON responses;
DROP POLICY IF EXISTS "Org members can update responses for their participants" ON responses;
DROP POLICY IF EXISTS "Org members can delete responses for their participants" ON responses;

CREATE POLICY "Admins can view responses for their org participants"
  ON responses FOR SELECT TO authenticated
  USING (
    (is_org_admin() OR is_hr_admin())
    AND participant_id IN (
      SELECT p.id FROM participants p
      WHERE p.organization_id IN (
        SELECT pr.organization_id FROM profiles pr WHERE pr.id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can insert responses for their org participants"
  ON responses FOR INSERT TO authenticated
  WITH CHECK (
    (is_org_admin() OR is_hr_admin())
    AND participant_id IN (
      SELECT p.id FROM participants p
      WHERE p.organization_id IN (
        SELECT pr.organization_id FROM profiles pr WHERE pr.id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can update responses for their org participants"
  ON responses FOR UPDATE TO authenticated
  USING (
    (is_org_admin() OR is_hr_admin())
    AND participant_id IN (
      SELECT p.id FROM participants p
      WHERE p.organization_id IN (
        SELECT pr.organization_id FROM profiles pr WHERE pr.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    (is_org_admin() OR is_hr_admin())
    AND participant_id IN (
      SELECT p.id FROM participants p
      WHERE p.organization_id IN (
        SELECT pr.organization_id FROM profiles pr WHERE pr.id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can delete responses for their org participants"
  ON responses FOR DELETE TO authenticated
  USING (
    (is_org_admin() OR is_hr_admin())
    AND participant_id IN (
      SELECT p.id FROM participants p
      WHERE p.organization_id IN (
        SELECT pr.organization_id FROM profiles pr WHERE pr.id = auth.uid()
      )
    )
  );

-- =============================================
-- 3. EMPLOYEE TALENT SNAPSHOTS: Restrict to admin roles
-- =============================================
DROP POLICY IF EXISTS "Users can view their org snapshots" ON employee_talent_snapshots;
DROP POLICY IF EXISTS "Users can insert their org snapshots" ON employee_talent_snapshots;
DROP POLICY IF EXISTS "Users can update their org snapshots" ON employee_talent_snapshots;
DROP POLICY IF EXISTS "Users can delete their org snapshots" ON employee_talent_snapshots;

CREATE POLICY "Admins can view their org snapshots"
  ON employee_talent_snapshots FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id() AND (is_org_admin() OR is_hr_admin()));

CREATE POLICY "Admins can insert their org snapshots"
  ON employee_talent_snapshots FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization_id() AND (is_org_admin() OR is_hr_admin()));

CREATE POLICY "Admins can update their org snapshots"
  ON employee_talent_snapshots FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id() AND (is_org_admin() OR is_hr_admin()));

CREATE POLICY "Admins can delete their org snapshots"
  ON employee_talent_snapshots FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id() AND (is_org_admin() OR is_hr_admin()));

-- =============================================
-- 4. NOTIFICATIONS: Restrict INSERT to admin roles
-- =============================================
DROP POLICY IF EXISTS "Admins can create notifications for their org" ON notifications;

CREATE POLICY "Admins can create notifications for their org"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND (is_org_admin() OR is_hr_admin())
  );

-- =============================================
-- 5. USER ROLES: Add SELECT for org admins to view roles in their org
-- =============================================
CREATE POLICY "Org admins can view roles for their org users"
  ON user_roles FOR SELECT TO authenticated
  USING (
    is_org_admin(auth.uid())
    AND user_id IN (
      SELECT profiles.id FROM profiles
      WHERE profiles.organization_id IN (
        SELECT p2.organization_id FROM profiles p2 WHERE p2.id = auth.uid()
      )
    )
  );
