-- Remove role column from profiles (roles should only be in user_roles table)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Add subscription and management fields to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS max_hr_admins integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS assessment_limit integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS billing_cycle_start date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add index for active organizations lookup
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);

-- Create a function to check if user is org_admin
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'org_admin'
  )
$$;

-- Create a function to check if user is hr_admin
CREATE OR REPLACE FUNCTION public.is_hr_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'hr_admin'
  )
$$;