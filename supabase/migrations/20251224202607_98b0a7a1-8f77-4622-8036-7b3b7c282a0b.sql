-- SECURITY FIX: Add explicit policies to deny anonymous access to sensitive tables

-- Participants table: contains PII (email, name, employee code)
CREATE POLICY "Deny anonymous access to participants"
ON public.participants
FOR SELECT
TO anon
USING (false);

-- Profiles table: contains user data
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Assessment groups table: contains access tokens
CREATE POLICY "Deny anonymous access to assessment_groups"
ON public.assessment_groups
FOR SELECT
TO anon
USING (false);

-- Assessments table
CREATE POLICY "Deny anonymous access to assessments"
ON public.assessments
FOR SELECT
TO anon
USING (false);

-- Questions table: contains correct answers
CREATE POLICY "Deny anonymous access to questions"
ON public.questions
FOR SELECT
TO anon
USING (false);

-- Responses table
CREATE POLICY "Deny anonymous access to responses"
ON public.responses
FOR SELECT
TO anon
USING (false);

-- Organizations table
CREATE POLICY "Deny anonymous access to organizations"
ON public.organizations
FOR SELECT
TO anon
USING (false);

-- User roles table
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);

-- SECURITY FIX: Add INSERT/UPDATE/DELETE policies for responses table
-- (Currently only has SELECT policy for org members)
CREATE POLICY "Org members can insert responses for their participants"
ON public.responses
FOR INSERT
TO authenticated
WITH CHECK (
  participant_id IN (
    SELECT p.id FROM participants p
    WHERE p.organization_id IN (
      SELECT pr.organization_id FROM profiles pr WHERE pr.id = auth.uid()
    )
  )
);

CREATE POLICY "Org members can update responses for their participants"
ON public.responses
FOR UPDATE
TO authenticated
USING (
  participant_id IN (
    SELECT p.id FROM participants p
    WHERE p.organization_id IN (
      SELECT pr.organization_id FROM profiles pr WHERE pr.id = auth.uid()
    )
  )
)
WITH CHECK (
  participant_id IN (
    SELECT p.id FROM participants p
    WHERE p.organization_id IN (
      SELECT pr.organization_id FROM profiles pr WHERE pr.id = auth.uid()
    )
  )
);

CREATE POLICY "Org members can delete responses for their participants"
ON public.responses
FOR DELETE
TO authenticated
USING (
  participant_id IN (
    SELECT p.id FROM participants p
    WHERE p.organization_id IN (
      SELECT pr.organization_id FROM profiles pr WHERE pr.id = auth.uid()
    )
  )
);

-- SECURITY FIX: Allow org admins to manage user_roles for their organization
CREATE POLICY "Org admins can manage roles for their org users"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.is_org_admin(auth.uid()) AND
  user_id IN (
    SELECT id FROM profiles 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  public.is_org_admin(auth.uid()) AND
  user_id IN (
    SELECT id FROM profiles 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);