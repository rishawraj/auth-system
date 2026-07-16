# TODO

- [ ] Improve code | cleanup

  - [x] login/signup UI update
  - [ ] fix types with shared dir
  - [ ] resend code option at /profile/verify-email
  - [ ] resend code option at /verify?pending_email with a timer 60sec

  - [ ] profile-image update bug: when a user cancels the image upload after selecting the image the image still perisists in that local image holder.
  - [ ] add toasts where needed

- [x] cron job to remove un-verified pending_email.
- [ ] cron job to remove orphan image url in the r2 proife-pic bucket

- [ ] Session management with read device | Revocation control.

  - Devices & Sessions Section
  - IP, Location, Browser, last-active
  - log out this devices (invaildate JIT)

- [ ] CSRF protection

  - double submit cookie tokens
  - SameSiste=Strict/lax

- [ ] Rate-Limiting on Auth Endpoints

  - login, password-reset, resend-code.
  - token bucket limiter (by redis)

- [ ] New Devices login email alerts

- [ ] Outbox for email

- [ ] observability

  - JSON logs with request-correlation ID threaded through every handler.
  - Grafana panels (login/success/failure-rate) p99 latency, active sessions.

- [ ] test suite

  - integration tests with a real Postgres (testcontainers)

- [ ] Passkey / WebAuthn
