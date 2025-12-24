-- Drop the existing restrictive policies on user_roles
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create PERMISSIVE policies instead (default behavior, uses OR logic)
CREATE POLICY "Super admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());