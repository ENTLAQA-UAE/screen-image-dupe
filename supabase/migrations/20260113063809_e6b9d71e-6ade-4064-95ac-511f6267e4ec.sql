-- Add submission_type column to track how assessment was submitted
ALTER TABLE public.participants 
ADD COLUMN submission_type text DEFAULT 'normal';

-- Add comment explaining the column
COMMENT ON COLUMN public.participants.submission_type IS 'Tracks how the assessment was submitted: normal, auto_submitted (tab closed), or time_expired';