-- Database Schema for Authentication System

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),
    verification_code_expiry_time TIMESTAMP,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_super_user BOOLEAN DEFAULT FALSE,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    oauth_token_expires_at TIMESTAMP,
    reset_password_token TEXT,
    reset_password_token_expiry_time TIMESTAMP
);

-- Create indexes for performance
ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);

CREATE UNIQUE INDEX oauth_user_idx ON users USING btree (oauth_provider, oauth_id) WHERE ((oauth_provider IS NOT NULL) AND (oauth_id IS NOT NULL));


-- Comments on table and columns
COMMENT ON TABLE users IS 'Stores user account information including authentication and OAuth details';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.name IS 'User''s full name';
COMMENT ON COLUMN users.email IS 'User''s email address, must be unique';
COMMENT ON COLUMN users.password IS 'Hashed password using bcrypt';
COMMENT ON COLUMN users.is_active IS 'Whether the user has verified their email';
COMMENT ON COLUMN users.verification_code IS '6-digit code sent for email verification';
COMMENT ON COLUMN users.verification_code_expiry_time IS 'Expiration time for verification code';
COMMENT ON COLUMN users.registration_date IS 'When the user registered';
COMMENT ON COLUMN users.last_login IS 'Last successful login timestamp';
COMMENT ON COLUMN users.is_super_user IS 'Whether the user has administrative privileges';
COMMENT ON COLUMN users.oauth_provider IS 'Name of OAuth provider (e.g., "google")';
COMMENT ON COLUMN users.oauth_id IS 'Unique ID from OAuth provider';
COMMENT ON COLUMN users.oauth_access_token IS 'OAuth access token';
COMMENT ON COLUMN users.oauth_refresh_token IS 'OAuth refresh token for getting new access tokens';
COMMENT ON COLUMN users.oauth_token_expires_at IS 'When the OAuth token expires';
COMMENT ON COLUMN users.reset_password_token IS 'Token for password reset';
COMMENT ON COLUMN users.reset_password_token_expiry_time IS 'Expiration time for password reset token';