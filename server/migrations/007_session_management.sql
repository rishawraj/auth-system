-- Migration 007: Support multi-device session management by removing unique constraint on user_id in refresh_tokens

ALTER TABLE public.refresh_tokens DROP CONSTRAINT IF EXISTS unique_user_id;

-- Create indexes for fast lookup by user_id and jti
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON public.refresh_tokens (jti);
