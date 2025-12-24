-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create question_bank table for reusable questions
CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  language TEXT NOT NULL DEFAULT 'en',
  assessment_type TEXT,
  difficulty TEXT DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  subdomain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Deny anonymous access to question_bank"
  ON public.question_bank
  FOR SELECT
  USING (false);

CREATE POLICY "Org members can manage their question_bank"
  ON public.question_bank
  FOR ALL
  USING (organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Super admins can manage all question_bank"
  ON public.question_bank
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Create indexes for efficient filtering
CREATE INDEX idx_question_bank_org ON public.question_bank(organization_id);
CREATE INDEX idx_question_bank_type ON public.question_bank(assessment_type);
CREATE INDEX idx_question_bank_tags ON public.question_bank USING GIN(tags);

-- Update timestamp trigger
CREATE TRIGGER update_question_bank_updated_at
  BEFORE UPDATE ON public.question_bank
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();