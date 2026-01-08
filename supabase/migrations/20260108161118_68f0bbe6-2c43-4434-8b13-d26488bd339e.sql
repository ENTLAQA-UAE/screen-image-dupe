-- Create table to cache employee talent snapshots
CREATE TABLE public.employee_talent_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_email TEXT NOT NULL,
  snapshot_text TEXT NOT NULL,
  assessment_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, employee_email)
);

-- Enable RLS
ALTER TABLE public.employee_talent_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies: org members can read/write their own org's snapshots
CREATE POLICY "Users can view their org snapshots"
ON public.employee_talent_snapshots
FOR SELECT
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert their org snapshots"
ON public.employee_talent_snapshots
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update their org snapshots"
ON public.employee_talent_snapshots
FOR UPDATE
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete their org snapshots"
ON public.employee_talent_snapshots
FOR DELETE
USING (organization_id = public.get_user_organization_id());

-- Trigger for updated_at
CREATE TRIGGER update_employee_talent_snapshots_updated_at
BEFORE UPDATE ON public.employee_talent_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_talent_snapshots_org_email ON public.employee_talent_snapshots(organization_id, employee_email);