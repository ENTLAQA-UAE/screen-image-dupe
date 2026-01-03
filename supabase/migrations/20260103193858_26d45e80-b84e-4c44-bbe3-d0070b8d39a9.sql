-- Create competencies table for organization-specific competencies
CREATE TABLE public.competencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Enable RLS
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Deny anonymous access to competencies"
  ON public.competencies
  FOR SELECT
  USING (false);

CREATE POLICY "Org members can view their competencies"
  ON public.competencies
  FOR SELECT
  USING (organization_id IN (
    SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
  ));

CREATE POLICY "Org admins can manage their competencies"
  ON public.competencies
  FOR ALL
  USING (
    organization_id IN (
      SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
    AND (is_org_admin(auth.uid()) OR is_hr_admin(auth.uid()))
  )
  WITH CHECK (
    organization_id IN (
      SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
    AND (is_org_admin(auth.uid()) OR is_hr_admin(auth.uid()))
  );

CREATE POLICY "Super admins can manage all competencies"
  ON public.competencies
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_competencies_updated_at
  BEFORE UPDATE ON public.competencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default competencies for existing organizations
INSERT INTO public.competencies (organization_id, name, name_ar, description)
SELECT 
  o.id,
  c.name,
  c.name_ar,
  c.description
FROM organizations o
CROSS JOIN (
  VALUES 
    ('decision-making', 'اتخاذ القرارات', 'Ability to make effective decisions under pressure'),
    ('teamwork', 'العمل الجماعي', 'Ability to work collaboratively with others'),
    ('leadership', 'القيادة', 'Ability to lead and motivate others'),
    ('customer-service', 'خدمة العملاء', 'Ability to serve and satisfy customers'),
    ('integrity', 'النزاهة', 'Adherence to ethical principles and values')
) AS c(name, name_ar, description);