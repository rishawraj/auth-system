-- Drop the existing strict constraints
ALTER TABLE admin_audit_logs
DROP CONSTRAINT admin_audit_logs_target_user_id_fkey;

-- Add the new constraint with ON DELETE SET NULL

ALTER TABLE admin_audit_logs
ADD CONSTRAINT admin_audit_logs_target_user_id_fkey
FOREIGN KEY (target_user_id)
REFERENCES users(id)
ON DELETE SET NULL;