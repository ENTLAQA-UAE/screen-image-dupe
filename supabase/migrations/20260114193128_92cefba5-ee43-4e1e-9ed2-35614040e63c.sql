-- Fix email API key exposure: Only admins should be able to SELECT email settings with API keys
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Org admins can view their email settings" ON public.organization_email_settings;

-- Create a new policy that only allows org_admin or super_admin to view email settings
CREATE POLICY "Only admins can view email settings" 
ON public.organization_email_settings 
FOR SELECT 
USING (
  (organization_id = get_user_organization_id()) 
  AND (is_org_admin() OR is_super_admin())
);