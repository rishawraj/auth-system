# TODO

## Frontend

- [ ] Implement UI
  - [ ] Look for inspiration (e.g. dashboard)
  - [ ] Admin dashboard
  - [ ] Use React Query

## Features

- [ ] Rate limiting for login and register
- [ ] Runtime validation
- [ ] Admin functionality
- [ ] Profile picture
  - [ ] Upload profile pic
  - [ ] Allow Google profile pic to override Dicebear one

## Improvements

- [ ] Input Validation Enhancement

  - [ ] Add client-side password strength validation
  - [ ] Implement better OTP input handling with auto-focus
  - [ ] Add visual feedback for password requirements

- [ ] Accessibility Improvements

  - [ ] Add ARIA labels and roles
  - [ ] Implement keyboard navigation
  - [ ] Add screen reader friendly error messages

- [ ] Error Handling
  - [ ] Add more specific error messages
  - [ ] Implement retry mechanisms for failed API calls
  - [ ] Add network status monitoring

## New Features

- [ ] Recovery Options Management

  - [ ] Add backup email configuration
  - [ ] Add backup phone number setup
  - [ ] Implement recovery verification flow

- [ ] Backup Codes Enhancement

  - [ ] Add PDF export option
  - [ ] Implement QR code generation
  - [ ] Add encrypted file download

- [ ] Activity Monitoring

  - [ ] Recent login history
  - [ ] Device tracking
  - [ ] Location tracking

- [ ] Emergency Access System

  - [ ] Trusted contacts system
  - [ ] Emergency access protocol
  - [ ] Time-delayed account recovery

- [ ] Multi-Device Management

  - [ ] Device list view
  - [ ] Device authorization
  - [ ] Remote device logout

- [ ] Security Features

  - [ ] Security score system
  - [ ] Account security assessment
  - [ ] Security recommendations
  - [ ] Rate limiting UI with attempt counter

- [ ] Notification Preferences
  - [ ] Email alert settings
  - [ ] Push notification setup
  - [ ] Unusual activity alerts

## Deployment

- [ ] Deploy client to GitHub Pages (custom domain)
- [ ] Deploy server to Vercel / Render
- [ ] Setup database on Neon

## Testing

- [ ] Test all code

## Database

- [ ] Use AWS S3 or UploadThing for storing profile picture URLs (optional)
- [ ] Setup and integrate AWS SES for sending emails

## Miscellaneous

- [ ] SonarQube integration

## Notes

### Dicebear Avatar Example

```ts
const avatarUrl = `https://api.dicebear.com/7.x/adventurer/png?seed=${uuidv4()}`;
```

## structure

auth-system/
│
├── src/
│ ├── controllers/ # Handle request logic (e.g., register, login)
│ │ └── auth.controller.ts
│ │
│ ├── routes/ # API route definitions
│ │ └── auth.routes.ts
│ │
│ ├── services/ # Business logic (JWT, email, OTP, etc.)
│ │ ├── auth.service.ts
│ │ ├── token.service.ts
│ │ └── email.service.ts
│ │
│ ├── models/ # DB models or queries
│ │ └── user.model.ts
│ │
│ ├── middlewares/ # Auth, validation, error handling
│ │ ├── auth.middleware.ts
│ │ ├── error.middleware.ts
│ │ └── validate.middleware.ts
│ │
│ ├── utils/ # Helper functions (e.g., hashing, validation)
│ │ ├── hash.util.ts
│ │ └── validator.util.ts
│ │
│ ├── config/ # Env vars, DB config
│ │ ├── env.ts
│ │ └── db.ts
│ │
│ ├── app.ts # Express app setup
│ └── server.ts # Server entry point
│
├── prisma/ or drizzle/ # (If using an ORM like Prisma or Drizzle)
│ └── schema.prisma # or schema.ts
│
├── .env # Secrets and environment variables
├── package.json
├── tsconfig.json
└── README.md

## sse vs websockets

Rate limit all recovery endpoints.

Log all recovery attempts (IP, timestamp, status).

Don't reveal whether an email/phone exists.

Always hash and store tokens server-side.

Use HTTPS, secure cookies, CSRF protection.

Tokens should be single-use and expire.
