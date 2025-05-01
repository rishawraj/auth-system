## roles

- add a admin role to managae user
- [ ] alter db to isSuperUser === admin ??
- [ ] function of admin
- [ ] create more tables
  - [ ] blocked no!
  - [ ] use short lived jwts

## 2fa

    last_login_method VARCHAR(20),
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),

## tests

- test all code
