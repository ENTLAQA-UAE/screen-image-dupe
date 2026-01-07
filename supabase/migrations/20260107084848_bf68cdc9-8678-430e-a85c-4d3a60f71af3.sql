-- Fix critical security vulnerabilities in participants table RLS policies
-- Remove overly permissive anonymous access policies

-- Drop the problematic policies that allow anonymous access
DROP POLICY IF EXISTS "Allow anonymous participant registration" ON public.participants;
DROP POLICY IF EXISTS "Allow anonymous to read own participant" ON public.participants;

-- Create a security definer function to check if a participant access token is valid
CREATE OR REPLACE FUNCTION public.verify_participant_access(p_access_token uuid, p_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.participants
    WHERE id = p_participant_id
      AND access_token = p_access_token
  )
$$;

-- Create a function to get participant by access token (for edge functions to use)
CREATE OR REPLACE FUNCTION public.get_participant_by_token(p_access_token uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.participants
  WHERE access_token = p_access_token
  LIMIT 1
$$;

-- Create secure policies for anonymous participant registration via group link
-- This policy allows inserting only if the group exists and is active
CREATE POLICY "Anonymous can register via valid group link"
ON public.participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assessment_groups ag
    WHERE ag.id = group_id
    AND ag.is_active = true
    AND (ag.start_date IS NULL OR ag.start_date <= now())
    AND (ag.end_date IS NULL OR ag.end_date >= now())
  )
);

-- Allow participants to read their own record using access token
-- This is done via RPC functions in edge functions, not direct table access
-- So we don't need an anonymous SELECT policy

-- Ensure org members can still manage participants
-- (These policies already exist but let's verify they're correct)
DROP POLICY IF EXISTS "Org members can manage their participants" ON public.participants;
CREATE POLICY "Org members can manage their participants"
ON public.participants
FOR ALL
USING (
  organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT profiles.organization_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);