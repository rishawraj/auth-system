-- UP
CREATE TABLE IF NOT EXISTS rate_limits (
  key VARCHAR(255) PRIMARY KEY,
  points INTEGER NOT NULL,
  expire BIGINT
);

CREATE INDEX idx_rate_limits_expire ON rate_limits (expire);

