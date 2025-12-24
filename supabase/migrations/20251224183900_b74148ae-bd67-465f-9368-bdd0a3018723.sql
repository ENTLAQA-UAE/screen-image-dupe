-- Enable RLS on assessment_groups
ALTER TABLE public.assessment_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all assessment_groups"
ON public.assessment_groups
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Org members can manage their assessment_groups"
ON public.assessment_groups
FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Enable RLS on participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all participants"
ON public.participants
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Org members can manage their participants"
ON public.participants
FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Enable RLS on questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all questions"
ON public.questions
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Org members can manage their questions"
ON public.questions
FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Enable RLS on responses
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all responses"
ON public.responses
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Org members can view responses for their participants"
ON public.responses
FOR SELECT
TO authenticated
USING (
  participant_id IN (
    SELECT id FROM public.participants 
    WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Add UPDATE and DELETE policies for assessments table (currently missing)
CREATE POLICY "admins_update_own_org_assessments"
ON public.assessments
FOR UPDATE
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "admins_delete_own_org_assessments"
ON public.assessments
FOR DELETE
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Super admins can manage all assessments"
ON public.assessments
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());