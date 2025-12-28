-- Add unique constraint to prevent duplicate submissions per participant per group
-- First, clean up any potential duplicates (keep the first entry per group+email/employee_code combo)
-- Note: We can't easily delete duplicates without more complex logic, so we just add the constraint going forward

-- Add unique constraint on group_id + email for participant deduplication
-- This ensures no one can submit twice with the same email in the same group
CREATE UNIQUE INDEX IF NOT EXISTS participants_group_email_unique 
ON participants (group_id, email) 
WHERE email IS NOT NULL AND group_id IS NOT NULL;

-- Add unique constraint on group_id + employee_code for participant deduplication
-- This ensures no one can submit twice with the same employee code in the same group
CREATE UNIQUE INDEX IF NOT EXISTS participants_group_employee_code_unique 
ON participants (group_id, employee_code) 
WHERE employee_code IS NOT NULL AND group_id IS NOT NULL;