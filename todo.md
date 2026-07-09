# TODO

- [ ] Improve code | cleanup

  - [ ] login/signup UI update

- [ ] cron job to remove un-verified pending_email.

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
