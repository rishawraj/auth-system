# Authentication System Documentation

## Overview

A complete authentication system built with Node.js, React, and PostgreSQL that provides secure user authentication with email verification and OAuth2.0 integration.

## Tech Stack

### Frontend

- React + TypeScript
- Vite (Build tool)
- TanStack Router (Routing)
- Tailwind CSS (Styling)
- Zod (Form validation)
- js-cookie (Cookie management)

### Backend

- Node.js + TypeScript
- PostgreSQL (Database)
- JWT (Authentication tokens)
- bcrypt (Password hashing)
- Nodemailer (Email service)
- Google OAuth2.0 (Social login)

## Features

1. **User Authentication**

   - Email/Password Registration
   - Email Verification
   - Login/Logout
   - Password Reset
   - Google OAuth2.0 Integration

2. **Security**

   - Password Hashing with bcrypt
   - JWT-based Authentication
   - Protected Routes
   - Email Verification
   - Secure Password Reset Flow

3. **Email Features**
   - Verification Emails
   - Password Reset Emails
   - Asynchronous Email Processing

## Project Structure

### Frontend (`/client`)

```
src/
├── components/           # Reusable UI components
├── routes/              # Route components and configurations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

### Backend (`/server`)

```
src/
├── auth/               # Authentication-related code
├── config/            # Configuration files
├── controllers/       # Request handlers
├── models/           # Data models
├── routes/           # API routes
├── utils/            # Utility functions
└── workers/          # Background workers
```

## API Endpoints

### Authentication Routes

- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /verify` - Email verification
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset
- `GET /auth/google` - Google OAuth2.0 login
- `GET /auth/google/callback` - Google OAuth2.0 callback

### User Routes

- `GET /profile` - Get user profile
- `GET /users` - Get all users (admin only)

## Setup & Installation

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   ```

2. **Frontend Setup**

   ```bash
   cd client
   npm install
   cp .env.example .env
   # Configure environment variables
   npm run dev
   ```

3. **Backend Setup**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Configure environment variables
   npm run dev
   ```

4. **Database Setup**
   - Install PostgreSQL
   - Create a database
   - Update database configuration in server/.env

## Environment Variables

### Frontend (.env)

```
VITE_API_BASE_URL=http://localhost:3000
```

### Backend (.env)

```
SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_email
EMAIL_APP_PASSWORD=your_app_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_system_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Security Considerations

1. **Password Security**

   - Passwords are hashed using bcrypt
   - Minimum password length enforcement
   - Password reset tokens with expiration

2. **JWT Security**

   - Short-lived tokens
   - Secure cookie storage
   - Protected routes validation

3. **OAuth Security**
   - Secure client credentials storage
   - State parameter validation
   - Token refresh mechanism

## Error Handling

The system implements comprehensive error handling:

- Input validation errors
- Authentication errors
- Database errors
- Email service errors
- OAuth errors

## Future Improvements

1. [ ] Implement refresh tokens
2. [ ] Add more OAuth providers (GitHub, Facebook)
3. [ ] Add user roles and permissions
4. [ ] Implement rate limiting
5. [ ] Add session management
6. [ ] Add 2FA support
