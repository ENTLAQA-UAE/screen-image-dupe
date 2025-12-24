-- Add missing columns to participants table for employee profile data
ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS job_title text;