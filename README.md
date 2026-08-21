# Authentication System

A robust, production-ready full-stack authentication, session management, and user administration system built with React 19, Node.js, TypeScript, PostgreSQL, and AWS CDK.

---

## Features

### Authentication & Authorization
- **Email & Password**: Secure registration and login with bcrypt hashing.
- **Passwordless Magic Links**: Instant sign-in links delivered via email using secure single-use SHA-256 tokens.
- **Email Verification**: Verification codes sent upon registration with resend throttle timers.
- **Google OAuth 2.0**: Seamless social login and account linking.
- **Token-Based Sessions**: Short-lived JWT access tokens and rotatable refresh tokens stored in secure, `HttpOnly`, `SameSite` cookies.
- **Password Reset**: Secure tokenized password recovery workflow.

### Multi-Device Session Management
- **Device & Browser Tracking**: Parses User-Agent (`ua-parser-js`) and IP to record browser, operating system, device type, and location.
- **Active Session Explorer**: Users can view all logged-in devices with a "Current Device" badge and last-active timestamps.
- **Granular Revocation**: Revoke individual sessions or instantly trigger "Revoke All Other Sessions".
- **Admin Session Control**: Administrators can inspect active sessions of any user and force-terminate unauthorized devices.

### Multi-Tier Rate Limiting
Persistent, PostgreSQL-backed rate limiting using `rate-limiter-flexible`:
- **Tier 3 (Global API Protection)**: 200 req / 15 min per IP with `Retry-After` and `X-RateLimit-*` headers.
- **Tier 2 (Anti-Brute Force)**: 7 req / 15 min on sensitive authentication, password reset, and 2FA endpoints.
- **Tier 1 (Outbound Email Abuse Prevention)**: 4 emails / 1 hour per target to prevent spam and provider cost overruns.

### Security & Two-Factor Authentication (2FA)
- **TOTP 2FA**: Time-based one-time password generation compatible with Google Authenticator, Authy, etc., complete with QR code provisioning.
- **Hashed Backup Recovery Codes**: Generate and store bcrypt-hashed single-use emergency recovery codes.
- **Step-Up Verification**: OTP email verification required to disable 2FA or regenerate backup codes for OAuth accounts.
- **Security Alerts**: Automated notification emails on new device logins and existing account registration attempts.
- **Automated Cleanup**: Scheduled cron job (`node-cron`) pruning unverified expired user registrations.

### User & Media Management
- **Profile Management**: Update user metadata, name, bio, and display details.
- **Cloudflare R2 / S3 Avatars**: Profile picture uploads directly integrated with Cloudflare R2 / AWS S3 storage.
- **Email Change Verification**: Two-step email updates requiring verification of the new address before cutover.

### Administration & Observability
- **Admin Dashboard**: System metrics, user growth overview, and recent activity feed.
- **User Management**: Paginated search, role updates (User/SuperUser), account suspensions, and soft deletion.
- **Audit Logs**: Immutable log tracking administrative actions and security events.
- **Structured JSON Logging**: High-performance logging powered by Pino, recording execution latency, client IP, user-agent, and scoped child loggers (`auth`, `http`, `database`, `worker`, `cron`).

### Reliability & Background Processing
- **Transactional Email Outbox**: Reliable email delivery using the Outbox pattern (`email_outbox` table) processed by an asynchronous background worker.
- **Automated Retries**: Email worker retries failed dispatches and maintains job statuses (`pending`, `processing`, `sent`, `failed`).

---

## Tech Stack

### Frontend
- **Framework**: React 19, Vite
- **Routing**: TanStack Router (File-based routing)
- **State & Data Fetching**: TanStack Query (React Query)
- **Styling & Motion**: Tailwind CSS, Framer Motion, Lucide Icons
- **Notifications**: Sonner
- **Validation**: Zod

### Backend
- **Runtime & Language**: Node.js (ESM), TypeScript
- **Database**: PostgreSQL (with connection pooling via `pg`)
- **Authentication**: `jsonwebtoken`, `bcrypt`, `otpauth`, `qrcode`, `google-auth-library`
- **Rate Limiting**: `rate-limiter-flexible`
- **Storage**: `@aws-sdk/client-s3` (Cloudflare R2 / AWS S3)
- **Email & Tasks**: Nodemailer, `node-cron`
- **Logging**: Pino & `pino-pretty`
- **Device Detection**: `ua-parser-js`

### DevOps & Infrastructure
- **Cloud IaC**: AWS CDK (TypeScript)
- **Compute & Networking**: AWS EC2 (Amazon Linux 2023), AWS VPC, ECR Docker Image Assets, SSM Session Manager
- **Containers**: Docker, Docker Compose, Multi-stage builds
- **Reverse Proxy**: Nginx

### Testing & Quality
- **Unit & Integration**: Vitest, Supertest
- **End-to-End**: Playwright
- **Git Hooks & Formatting**: Husky, Commitlint, Prettier, ESLint

---

## Monorepo Structure

```text
.
├── client/                      # React 19 Frontend Application
│   ├── src/
│   │   ├── components/          # UI Components (DevicesSessions, Admin, etc.)
│   │   ├── routes/              # TanStack Router File Routes
│   │   └── queries/             # TanStack Query hooks & API clients
│   └── Dockerfile.client
│
├── server/                      # Node.js TypeScript API & Background Workers
│   ├── migrations/              # SQL Migration scripts (001 to 008)
│   ├── scripts/                 # Migration & seed scripts
│   ├── src/
│   │   ├── config/              # Environment schema (Zod) & DB pool
│   │   ├── controllers/         # Auth, 2FA, User, Admin, Google Auth
│   │   ├── cron/                # Scheduled housekeeping jobs
│   │   ├── middleware/          # Auth & SuperUser guards
│   │   ├── routes/              # Route dispatchers
│   │   ├── utils/               # Rate limiters, R2 upload, logger, emailers
│   │   ├── workers/             # Email outbox queue worker
│   │   └── tests/               # Vitest integration tests
│   └── Dockerfile.server
│
├── shared/                      # Shared types, Zod schemas, and models
│   └── src/
│
├── infra/                       # AWS CDK Infrastructure as Code
│   ├── bin/infra.ts
│   └── lib/auth-system-stack.ts
│
├── nginx/                       # Nginx reverse proxy configuration
│   └── default.conf
│
├── docker-compose.yml           # Local multi-container development & orchestration
└── package.json                 # Monorepo NPM workspace configuration
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- npm or pnpm

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/rishawraj/auth-system.git
cd auth-system
npm install
```

### 2. Environment Configuration

Create `.env.development` inside `server/` (or root):

```env
NODE_ENV=development
PORT=3000
DOMAIN=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_system_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets & Expiry
ACCESS_TOKEN_SECRET=your_jwt_access_secret_min_32_chars
ACCESS_TOKEN_EXPIRY=900
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_min_32_chars
REFRESH_TOKEN_EXPIRY=604800
RESET_PASSWORD_SECRET=your_reset_password_secret_key
RESET_PASSWORD_EXPIRY=900
JWT_EXPIRATION=1d

# Email Dispatch
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Cloudflare R2 / S3 Storage (Optional for Avatars)
CF_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=auth-system-avatars
```

### 3. Run Database Migrations

```bash
npm run migrate --workspace=server
# Or optionally seed mock users
npm run seed --workspace=server
```

### 4. Start Development Servers

Run all workspaces concurrently:

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

---

## Docker Deployment

Run the complete multi-container stack (PostgreSQL + Auto-Migrations + Backend API + Nginx Frontend):

```bash
# Build and start services
docker compose --env-file .env.docker up --build -d

# Check live logs
docker compose logs -f

# Stop containers
docker compose down
```

---

## AWS CDK Cloud Deployment

The `infra/` directory provides a fully automated AWS CDK stack:
- Builds and packages Docker images to **Amazon ECR**.
- Provisions a cost-efficient **AWS VPC** (zero NAT gateway overhead).
- Launches an **Amazon EC2** instance (Amazon Linux 2023) with automated Docker Compose bootstrapping.
- Grants **AWS Systems Manager (SSM)** Session Manager for secure, SSH-keyless access.

```bash
cd infra
npm install
npx cdk bootstrap
npx cdk deploy
```

---

## Testing

The project includes unit, integration, and end-to-end tests:

```bash
# Run backend Vitest integration suite
npm run test --workspace=server

# Run test suite with Vitest UI
npm run test --workspace=server -- --ui

# Run Playwright End-to-End tests
npm run test:e2e
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register new user account |
| `POST` | `/login` | Email & password authentication |
| `POST` | `/logout` | Invalidate current refresh token and clear cookies |
| `GET` | `/refresh-token` | Rotate refresh token and obtain new access token |
| `POST` | `/verify` | Verify email address with 6-digit code |
| `POST` | `/resend-code` | Resend verification code for pending registration |
| `POST` | `/forgot-password` | Send password reset email |
| `POST` | `/reset-password` | Set new password using reset token |

### Passwordless Magic Link
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/magic-link/send` | Request a magic link sign-in email |
| `POST` | `/magic-link/verify` | Verify magic link token and initiate session |

### OAuth
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/google` | Initiate Google OAuth 2.0 flow |
| `GET` | `/auth/google/callback` | Google OAuth redirect callback |
| `GET` | `/auth/google/refresh-token` | Refresh Google OAuth session |

### Session Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/sessions` | List active sessions and device info for current user |
| `POST` | `/sessions/revoke` | Revoke a specific session by token ID |
| `POST` | `/sessions/revoke-others` | Revoke all active sessions except current device |

### User Profile & Account
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/me` | Get current authenticated user summary |
| `GET` | `/profile` | Get detailed user profile |
| `PATCH` | `/profile` | Update profile information and avatar |
| `POST` | `/verify-email` | Request email change verification |
| `POST` | `/resend-verify-email-code`| Resend verification code for pending email change |

### Two-Factor Authentication (TOTP & Backup Codes)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/2fa/enable` | Generate TOTP secret & QR code uri |
| `POST` | `/2fa/verify` | Verify initial TOTP code to activate 2FA and receive backup codes |
| `POST` | `/2fa/validate` | Validate TOTP code during 2FA login challenge |
| `POST` | `/2fa/validate-backup` | Validate and consume a single-use backup recovery code |
| `POST` | `/2fa/disable` | Disable 2FA with password confirmation |
| `POST` | `/2fa/disable-2fa-send-otp` | Send step-up verification OTP to disable 2FA |
| `POST` | `/2fa/disable-2fa-verify-otp` | Verify step-up OTP and disable 2FA |
| `POST` | `/2fa/regenerate-backup-codes-email` | Regenerate backup codes with password |
| `POST` | `/2fa/send-otp-google-user` | Send OTP to regenerate backup codes for Google user |
| `POST` | `/2fa/regenerate-backup-codes-google`| Verify OTP and regenerate backup codes for Google user |

### Administration
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/stats/overview` | Platform overview metrics and counters |
| `GET` | `/admin/recent-activity` | Global user sign-in and security activity stream |
| `GET` | `/admin/paginated-users` | Paginated user directory with search & filters |
| `GET` | `/admin/admin-audit-logs` | Administrative audit log entries |
| `GET` | `/admin/users/:id/sessions` | Fetch all active sessions for a target user |
| `POST` | `/admin/users/:id/revoke-sessions` | Force revoke all sessions for a target user |
| `PATCH` | `/admin/users/:id` | Update user status / roles |
| `DELETE` | `/admin/users/:id` | Soft delete user account |

---

## Roadmap & Future Enhancements

- [ ] WebAuthn / Passkeys (FIDO2 passwordless hardware keys & biometrics)
- [ ] GitHub OAuth Provider Integration
- [ ] Redis caching & distributed queue adapter for email outbox
- [ ] CSRF double-submit cookie protection with origin verification
- [ ] Grafana dashboard panels for p99 latency and session metrics
