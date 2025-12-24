-- Add primary_language column to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS primary_language text DEFAULT 'en';

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos for their organization
CREATE POLICY "Org admins can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations 
    WHERE id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- Allow authenticated users to update logos for their organization
CREATE POLICY "Org admins can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations 
    WHERE id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- Allow anyone to view organization logos (they're public branding)
CREATE POLICY "Anyone can view organization logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'organization-logos');

-- Allow org admins to delete their logos
CREATE POLICY "Org admins can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations 
    WHERE id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- Add policy for org admins to update their organization
CREATE POLICY "Org admins can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));