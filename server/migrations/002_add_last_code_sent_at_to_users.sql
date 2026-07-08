-- Add missing column to track when the last verification/2FA code was sent
ALTER TABLE public.users 
ADD COLUMN last_code_sent_at timestamp with time zone;