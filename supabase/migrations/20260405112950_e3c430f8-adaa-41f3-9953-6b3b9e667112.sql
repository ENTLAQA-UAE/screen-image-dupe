-- Fix: Notifications SELECT policy - scope to intended recipient or org-wide notifications
DROP POLICY IF EXISTS "Org members can view their notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Also scope UPDATE policy to own notifications
DROP POLICY IF EXISTS "Org members can update their notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );