-- First delete the older duplicate participant (keeping the most recent one)
DELETE FROM participants WHERE id = '47c2f759-dbb1-4edd-a8b2-292acfbcd63d';

-- Check for email duplicates and keep only the most recent
DELETE FROM participants p1
WHERE EXISTS (
  SELECT 1 FROM participants p2
  WHERE p1.group_id = p2.group_id
    AND p1.email = p2.email
    AND p1.group_id IS NOT NULL
    AND p1.email IS NOT NULL
    AND p1.started_at < p2.started_at
);

-- Add unique constraint for employee_code per group
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_unique_employee_code_per_group 
ON participants (group_id, employee_code) 
WHERE group_id IS NOT NULL AND employee_code IS NOT NULL;

-- Add unique constraint for email per group
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_unique_email_per_group 
ON participants (group_id, email) 
WHERE group_id IS NOT NULL AND email IS NOT NULL;