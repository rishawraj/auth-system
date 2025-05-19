-- Enable the pgcrypto extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    verification_code VARCHAR(100),
    verification_code_expiry_time TIMESTAMP,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_super_user BOOLEAN DEFAULT false,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    oauth_token_expires_at TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_passsword_token_expiry_time TIMESTAMPTZ,
    profile_pic TEXT,
    last_login_method VARCHAR(20),
    is_two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false,
    last_ip VARCHAR(45),
    last_browser TEXT,
    last_os TEXT,
    last_device TEXT,
    last_location TEXT,
    last_country TEXT,
    last_city TEXT
);

-- Unique composite index for OAuth users
CREATE UNIQUE INDEX IF NOT EXISTS oauth_user_idx ON public.users (oauth_provider, oauth_id)
WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;

-- REFRESH TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    jti VARCHAR(36) NOT NULL UNIQUE,
    token_hash TEXT NOT NULL UNIQUE,
    user_id uuid NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
