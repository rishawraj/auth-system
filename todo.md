# TODO

- [x] Session management with read device | Revocation control.

  - Devices & Sessions Section
  - IP, Location, Browser, last-active
  - log out this devices (invaildate JIT)

- [ ] CSRF protection

  - double submit cookie tokens
  - SameSite=Strict/lax

- [ ] New Devices login email alerts

  - [x] login/signup UI update
  - [x] fix types with shared dir
  - [x] resend code option at /profile/verify-email
  - [x] resend code option at /verify?pending_email with a timer 60sec

  - [x] profile-image update bug: when a user cancels the image upload after selecting the image the image still perisists in that local image holder.
  - [ ] add toasts where needed

- [x] cron job to remove un-verified pending_email.

- [x] Rate-Limiting on Auth Endpoints

- [x] Outbox for email

- [ ] observability

  - JSON logs with request-correlation ID threaded through every handler.
  - Grafana panels (login/success/failure-rate) p99 latency, active sessions.

- [ ] test suite
