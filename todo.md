- [ ] centralize jwt expiry time

## roles

- add a admin role to managae user
- [x] alter db to isSuperUser === admin ??
- [x] function of admin
- [x] create more tables
  - [ ] blocked no!
  - [x] use short lived jwts

## 2fa

    last_login_method VARCHAR(20),
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),

## tests

- test all code

## db

- [ ] add a profile pic field
  - file uploads
  - s3 bucket?
- [ ] last_login_method VARCHAR(20),
- [ ] is_two_factor_enabled BOOLEAN DEFAULT FALSE,
- [ ] two_factor_secret VARCHAR(255),
- [ ] is_deleted

{user.last_login}
{user.last_ip}
{user.last_browser}
{user.last_os}
{user.last_device}
{user.last_location}
{user.last_country}
{user.last_city}
{user.last_latitude}
{user.last_longitude}
{user.last_timezone}
{user.last_language}
{user.last_currency}

## frontend

- [ ] use react query

## clean up

- [ ] extract basic functions
  - [ ] getToken setToken
  - [ ]
  - [ ]
  - [ ]
  - [ ]
  - [ ]
  - [ ]
  - [ ]
  - [ ]

## notification

- [ ] install package
- [ ] implement
