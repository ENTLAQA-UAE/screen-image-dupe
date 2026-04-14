-- Add profile fields for the "Edit Profile" page: phone, title, avatar_url.
-- Create a public storage bucket for user avatars with RLS allowing each user
-- to upload/update/delete only files under a folder named with their user id.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Ensure the bucket exists (public readable so the <img> tag can load it).
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any pre-existing policies so re-running this migration is idempotent.
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Public read: anyone can fetch avatars (they're shown in the UI).
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-avatars');

-- Authenticated users can only write inside a folder equal to their auth.uid().
-- Paths look like "<uid>/avatar.png".
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
