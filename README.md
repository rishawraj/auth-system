# Authentication System

A production-ready authentication and user management system built with React, Node.js, TypeScript, PostgreSQL, and Docker.

## Features

### Authentication

- Email & Password Registration
- Email Verification
- Login / Logout
- Refresh Token Rotation
- Password Reset
- Google OAuth 2.0 Login
- JWT Authentication
- Secure Cookie-Based Sessions

### Security

- bcrypt Password Hashing
- Access & Refresh Tokens
- Email Verification Flow
- Password Reset Flow
- Login Activity Tracking
- Two-Factor Authentication (2FA)
- Backup Recovery Codes
- Protected Routes
- Admin Audit Logging

### User Management

- User Profile Management
- Profile Picture Uploads
- Email Change Verification
- Login History
- Account Security Settings

### Administration

- Admin Dashboard
- User Search & Pagination
- Audit Logs
- Login Activity Monitoring

### Infrastructure

- PostgreSQL Database
- Database Migrations
- Dockerized Deployment
- Nginx Reverse Proxy
- Health Checks
- Persistent Database Volumes

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Tailwind CSS
- Zod

### Backend

- Node.js
- TypeScript
- PostgreSQL
- pg
- JWT
- bcrypt
- Nodemailer
- Google OAuth 2.0

### DevOps

- Docker
- Docker Compose
- Nginx

---

## Project Structure

```text
.
├── client/
│   ├── src/
│   └── Dockerfile.client
│
├── server/
│   ├── migrations/
│   ├── scripts/
│   │   └── migrate.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── Dockerfile.server
│
├── docker-compose.yml
└── nginx/
```

---

## Running Locally

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
npm run dev
```

---

## Docker Setup

### Build and Start

```bash
docker compose --env-file .env.docker up --build -d
```

### View Logs

```bash
docker compose logs -f
```

### Stop Services

```bash
docker compose down
```

### Remove Containers and Database Volume

```bash
docker compose down -v
```

---

## Database Migrations

Run migrations manually:

```bash
npm run migrate
```

When using Docker, migrations run automatically before the API server starts.

Migration files are stored in:

```text
server/migrations/
```

Example:

```text
001_initial_schema.sql
002_add_new_feature.sql
003_update_indexes.sql
```

---

## Environment Variables

### Backend

```env
SECRET=
REFRESH_TOKEN_SECRET=

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

EMAIL_USER=
EMAIL_APP_PASSWORD=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FRONTEND_URL=
```

### Docker

```env
DB_USER=
DB_PASSWORD=
DB_NAME=
```

---

## API Highlights

### Authentication

```http
POST /register
POST /login
POST /logout
POST /refresh
POST /verify
POST /forgot-password
POST /reset-password
```

### OAuth

```http
GET /auth/google
GET /auth/google/callback
```

### User

```http
GET /profile
PATCH /profile
PATCH /change-email
POST /change-password
```

### Two Factor Authentication

```http
POST /2fa/setup
POST /2fa/verify
POST /2fa/disable
POST /2fa/backup-codes/regenerate
```

### Admin

```http
GET /admin/users
GET /admin/logs
GET /admin/overview
```

---

## Future Improvements

- GitHub OAuth
- Rate Limiting
- Redis-backed Queues
- Session Revocation Dashboard
- Account Lockout Policies
- WebAuthn / Passkeys
- Email Queue Worker
