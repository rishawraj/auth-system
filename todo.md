- [ ] centralize jwt expiry time

## implement all field in email login as they are in google login

- [ ] profile pic
  - [ ] generate a svg store in db or
  - [ ] use aws s3 (setup) | uploadthing.com ??
- [ ] ip, browser, os, device, location , country

## deploy

- [ ] client to gh-pages (domain)
- [ ] vercel / render /
- [ ] db (neon)

## 2fa

    last_login_method VARCHAR(20),
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),

## tests

- [ ] test all code

## db

- [ ] uuid

## frontend

- [ ] use react query

### aws services

- [ ] aws ses email

## profile pic

```ts
const avatarUrl = `https://api.dicebear.com/7.x/adventurer/png?seed=${uuidv4()}`;
```
