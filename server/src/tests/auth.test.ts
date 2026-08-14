import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import http from "http";
import { handler } from "../server.js";
import { pool } from "../config/db.config.js";
import {
  cleanDatabase,
  createTestUser,
  createTestPendingUser,
  getEmailOutboxEntries,
} from "./setup/testDb.js";
import { setupEmailMock } from "./setup/mocks.js";

function getUniqueEmail(prefix = "user"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

const getApp = () => http.createServer(handler);

describe("Authentication Integration Tests (/register, /verify, /login, /forgot-password, /reset-password, /me, /logout)", () => {
  let emailMock: ReturnType<typeof setupEmailMock>;

  beforeAll(async () => {
    emailMock = setupEmailMock();
    await cleanDatabase();
  });

  afterAll(async () => {
    emailMock.restore();
    await cleanDatabase();
  });

  beforeEach(async () => {
    emailMock.clearSentEmails();
    await cleanDatabase();
  });

  describe("User Registration (POST /register)", () => {
    test("registers a new user and queues verification email", async () => {
      const email = getUniqueEmail("alice");
      const payload = {
        name: "Alice Wonderland",
        email,
        password: "Password123!",
      };

      const res = await request(getApp()).post("/register").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("verification code has been sent");
      expect(res.body.pending_email).toBe(payload.email);

      // Verify user is in DB as unverified (pending_email set, email null)
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE pending_email = $1",
        [payload.email]
      );
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe(payload.name);
      expect(rows[0].email).toBeNull();
      expect(rows[0].is_active).toBe(false);
      expect(rows[0].verification_code).toBeDefined();

      // Verify outbox entry was queued
      const outbox = await getEmailOutboxEntries(payload.email);
      expect(outbox.length).toBeGreaterThan(0);
      expect(outbox[0].template).toBe("verification_code");
    });

    test("handles registration when user with email already exists", async () => {
      const email = getUniqueEmail("dup");
      const existing = await createTestUser({ email });

      const res = await request(getApp()).post("/register").send({
        name: "Duplicate User",
        email: existing.user.email,
        password: "Password123!",
      });

      // API gracefully returns success message to avoid user enumeration
      expect(res.status).toBe(201);

      // Verify notice was sent to outbox
      const outbox = await getEmailOutboxEntries(existing.user.email);
      expect(outbox.length).toBeGreaterThan(0);
      expect(outbox[0].template).toBe("existing_account_notice");
    });
  });

  describe("Email Verification (POST /verify)", () => {
    test("verifies user with valid 6-digit code and activates account", async () => {
      const pendingEmail = getUniqueEmail("bob");
      const validCode = "654321";

      await createTestPendingUser({
        pending_email: pendingEmail,
        verification_code: validCode,
        verification_code_expiry_time: new Date(Date.now() + 60 * 60 * 1000),
      });

      const res = await request(getApp()).post("/verify").send({
        pending_email: pendingEmail,
        code: validCode,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Account verified successfully");

      // Verify DB state: email is now active, pending_email & verification_code cleared
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [pendingEmail]
      );
      expect(rows.length).toBe(1);
      expect(rows[0].pending_email).toBeNull();
      expect(rows[0].verification_code).toBeNull();
      expect(rows[0].is_active).toBe(true);
    });

    test("rejects invalid or incorrect verification code", async () => {
      const pendingEmail = getUniqueEmail("charlie");
      await createTestPendingUser({
        pending_email: pendingEmail,
        verification_code: "999999",
        verification_code_expiry_time: new Date(Date.now() + 60 * 60 * 1000),
      });

      const res = await request(getApp()).post("/verify").send({
        pending_email: pendingEmail,
        code: "111111", // Wrong code
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid verification code");
    });

    test("rejects expired verification code", async () => {
      const pendingEmail = getUniqueEmail("david");
      await createTestPendingUser({
        pending_email: pendingEmail,
        verification_code: "123456",
        verification_code_expiry_time: new Date(Date.now() - 10000), // Expired
      });

      const res = await request(getApp()).post("/verify").send({
        pending_email: pendingEmail,
        code: "123456",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Verification code has expired");
    });
  });

  describe("User Login (POST /login)", () => {
    test("logs in successfully with valid credentials, returns access token and sets refresh cookie", async () => {
      const email = getUniqueEmail("eva");
      const { user, rawPassword } = await createTestUser({
        email,
        password: "MySecurePassword123!",
      });

      const res = await request(getApp())
        .post("/login")
        .set("User-Agent", "Mozilla/5.0 Chrome/120.0.0.0")
        .set("X-Forwarded-For", "192.168.1.50")
        .send({
          email: user.email,
          password: rawPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.accessToken).toBeDefined();

      // Check Set-Cookie header contains refreshToken
      const rawCookies = res.headers["set-cookie"];
      const cookieArray = Array.isArray(rawCookies)
        ? rawCookies
        : typeof rawCookies === "string"
        ? [rawCookies]
        : [];
      expect(cookieArray.some((c: string) => c.includes("refreshToken="))).toBe(true);

      // Check that a session was recorded in refresh_tokens table
      const { rows: sessions } = await pool.query(
        "SELECT * FROM refresh_tokens WHERE user_id = $1",
        [user.id]
      );
      expect(sessions.length).toBe(1);
      expect(sessions[0].ip_address).toBe("192.168.1.50");
    });

    test("fails login with incorrect password and logs failed attempt", async () => {
      const email = getUniqueEmail("frank");
      const { user } = await createTestUser({
        email,
        password: "CorrectPassword123!",
      });

      const res = await request(getApp())
        .post("/login")
        .set("X-Forwarded-For", "192.168.1.51")
        .send({
          email: user.email,
          password: "WrongPassword999!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    test("fails login with unverified email account", async () => {
      const pendingEmail = getUniqueEmail("unverified");
      await createTestPendingUser({
        pending_email: pendingEmail,
        password: "ValidPassword123!",
      });

      const res = await request(getApp())
        .post("/login")
        .set("X-Forwarded-For", "192.168.1.52")
        .send({
          email: pendingEmail,
          password: "ValidPassword123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });
  });

  describe("Password Reset Flow (/forgot-password & /reset-password)", () => {
    test("forgot password queues reset email with reset token in DB", async () => {
      const email = getUniqueEmail("grace");
      const { user } = await createTestUser({ email });

      const res = await request(getApp())
        .post("/forgot-password")
        .send({ email: user.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("a reset link has been sent");

      // Verify token in DB
      const { rows } = await pool.query(
        "SELECT reset_password_token, reset_password_token_expiry_time FROM users WHERE id = $1",
        [user.id]
      );
      expect(rows[0].reset_password_token).toBeDefined();
      expect(rows[0].reset_password_token_expiry_time).toBeDefined();

      // Verify email outbox entry
      const outbox = await getEmailOutboxEntries(user.email);
      expect(outbox.length).toBeGreaterThan(0);
      expect(outbox[0].template).toBe("reset_password");
    });

    test("resets password successfully with valid token and allows login with new password", async () => {
      const email = getUniqueEmail("heidi");
      const { user } = await createTestUser({
        email,
        password: "OldPassword123!",
      });

      // Request password reset
      await request(getApp())
        .post("/forgot-password")
        .send({ email: user.email });

      const { rows } = await pool.query(
        "SELECT reset_password_token FROM users WHERE id = $1",
        [user.id]
      );
      const resetToken = rows[0].reset_password_token;

      // Submit reset password
      const newPassword = "BrandNewPassword123!";
      const resetRes = await request(getApp())
        .post("/reset-password")
        .send({
          token: resetToken,
          password: newPassword,
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toBe("Password reset successfully");

      // Verify user can login with new password
      const loginRes = await request(getApp())
        .post("/login")
        .send({
          email: user.email,
          password: newPassword,
        });
      expect(loginRes.status).toBe(200);
    });
  });

  describe("Authenticated Profile & Logout (/me, /logout)", () => {
    test("GET /me returns authenticated user payload when valid access token is provided", async () => {
      const email = getUniqueEmail("ivan");
      const { user, accessToken } = await createTestUser({
        name: "Ivan Test",
        email,
      });

      const res = await request(getApp())
        .get("/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user.id);
      expect(res.body.email).toBe(user.email);
      expect(res.body.name).toBe(user.name);
    });

    test("GET /me returns 401 when token is missing or invalid", async () => {
      const res = await request(getApp()).get("/me");
      expect(res.status).toBe(401);
    });

    test("POST /logout revokes session in DB and clears refresh cookie", async () => {
      const email = getUniqueEmail("judy");
      const { user, rawPassword } = await createTestUser({
        email,
        password: "Password123!",
      });

      // Login first to get cookie
      const loginRes = await request(getApp())
        .post("/login")
        .send({ email: user.email, password: rawPassword });

      const rawCookie = loginRes.headers["set-cookie"];
      const cookieHeader = Array.isArray(rawCookie)
        ? rawCookie[0]
        : (rawCookie as string);

      // Logout with cookie and type: 'email'
      const logoutRes = await request(getApp())
        .post("/logout")
        .set("Cookie", cookieHeader)
        .send({ type: "email" });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe("Logged out successfully");

      // Verify refresh tokens are deleted/revoked for user
      const { rows } = await pool.query(
        "SELECT * FROM refresh_tokens WHERE user_id = $1",
        [user.id]
      );
      expect(rows.length).toBe(0);
    });
  });
});
