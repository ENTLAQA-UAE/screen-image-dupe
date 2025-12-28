
-- Drop the problematic RLS policy
DROP POLICY IF EXISTS "Org admins can view profiles in their organization" ON public.profiles;

-- Create a security definer function to get user's organization_id safely
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = _user_id
$$;

-- Create new RLS policy using the security definer function
CREATE POLICY "Org admins can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
  is_org_admin(auth.uid()) 
  AND organization_id = get_user_organization_id(auth.uid())
);
