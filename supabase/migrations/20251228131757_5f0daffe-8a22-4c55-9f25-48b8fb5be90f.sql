
-- Allow org admins to view profiles in their organization
CREATE POLICY "Org admins can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
  is_org_admin(auth.uid()) 
  AND organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
