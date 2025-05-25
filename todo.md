## todo

- [ ] implement frontend

  - look for inspiration copy something (dashboard?)
  - admin

- [ ] notification for login / logouts

- [ ] rate limiting login register

- [ ] account recovery

- [ ] runtime validation?

- [x] logout remove access token in google oauth
- [x] in /verify
      set http cookies
      and in client
      handle it.
- [x] then implement client side refreshtoken logic.

- [x] use .env var for client and server url
- [x] centralize jwt expiry time
- [x] husky
- [x] eslint
- [x] req to server for admin status ?? => no.
  - [x] but request to server for admin resources.

---

##

- [x] refresh tokens
- [ ] limited access after registration if done by email.
no

## implement all field in email login as they are in google login

- [x] profile pic
  - [x] generate a svg store in db or
  - [ ] use aws s3 (setup) | uploadthing.com ??
    - no just use db to store the url.
- [x] ip, browser, os, device, location , country

## deploy

- [ ] client to gh-pages (domain)
- [ ] vercel / render /
- [ ] db (neon)

## 2fa vs mfa

    last_login_method VARCHAR(20),
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),

## tests

- [ ] test all code

## db

- [x] uuid

## frontend

- [ ] use react query

### aws services

- [ ] aws ses email

## profile pic

```ts
const avatarUrl = `https://api.dicebear.com/7.x/adventurer/png?seed=${uuidv4()}`;
```

- [ ] google profile pic override the dicebear one?
- [ ] upload profile pic

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
