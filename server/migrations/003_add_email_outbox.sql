CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE email_outbox (
  id BIGSERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  payload JSONB NOT NULL,
  status email_status NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_outbox_pending
  ON email_outbox (next_attempt_at)
  WHERE status = 'pending';