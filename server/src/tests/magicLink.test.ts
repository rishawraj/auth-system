import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import http from "http";
import crypto from "crypto";
import { handler } from "../server.js";
import { pool } from "../config/db.config.js";
import {
  cleanDatabase,
  createTestUser,
  getEmailOutboxEntries,
} from "./setup/testDb.js";
import { setupEmailMock } from "./setup/mocks.js";

const getApp = () => http.createServer(handler);

describe("Magic Link Authentication Integration Tests (/magic-link/send, /magic-link/verify)", () => {
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

  describe("Send Magic Link (POST /magic-link/send)", () => {
    test("sends magic link email for existing active user", async () => {
      const { user } = await createTestUser({
        email: "magic-user@example.com",
        name: "Magic User",
      });

      const res = await request(getApp())
        .post("/magic-link/send")
        .send({ email: user.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("If an account exists");

      // Check DB for token
      const tokenRows = await pool.query(
        "SELECT * FROM magic_link_tokens WHERE user_id = $1",
        [user.id]
      );
      expect(tokenRows.rows.length).toBe(1);
      expect(tokenRows.rows[0].used).toBe(false);

      // Check email outbox
      const outbox = await getEmailOutboxEntries(user.email);
      expect(outbox.length).toBe(1);
      expect(outbox[0].template).toBe("magic_link");
      const payload = typeof outbox[0].payload === "string"
        ? JSON.parse(outbox[0].payload)
        : outbox[0].payload;
      expect(payload.magicLink).toContain("/magic-link/verify?token=");
    });

    test("returns generic success response for non-existent email without queuing email", async () => {
      const res = await request(getApp())
        .post("/magic-link/send")
        .send({ email: "nonexistent@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("If an account exists");

      const outbox = await getEmailOutboxEntries("nonexistent@example.com");
      expect(outbox.length).toBe(0);
    });

    test("returns 400 for invalid email payload", async () => {
      const res = await request(getApp())
        .post("/magic-link/send")
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("Verify Magic Link (POST /magic-link/verify)", () => {
    test("successfully verifies valid magic link and logs user in", async () => {
      const { user } = await createTestUser({
        email: "verified-magic@example.com",
      });

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        "INSERT INTO magic_link_tokens (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
        [user.id, user.email, tokenHash, expiresAt]
      );

      const res = await request(getApp())
        .post("/magic-link/verify")
        .send({ token: rawToken, email: user.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.type).toBe("magic_link");
      expect(res.body.isTwoFactorEnabled).toBe(false);

      // Verify cookie
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes("refreshToken="))).toBe(true);

      // Verify token is marked as used
      const { rows } = await pool.query(
        "SELECT used, used_at FROM magic_link_tokens WHERE token_hash = $1",
        [tokenHash]
      );
      expect(rows[0].used).toBe(true);
      expect(rows[0].used_at).not.toBeNull();
    });

    test("fails when trying to reuse a consumed magic link token", async () => {
      const { user } = await createTestUser({
        email: "reuse-magic@example.com",
      });

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        "INSERT INTO magic_link_tokens (user_id, email, token_hash, expires_at, used) VALUES ($1, $2, $3, $4, true)",
        [user.id, user.email, tokenHash, expiresAt]
      );

      const res = await request(getApp())
        .post("/magic-link/verify")
        .send({ token: rawToken, email: user.email });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid, used, or expired");
    });

    test("fails when verifying with expired magic link token", async () => {
      const { user } = await createTestUser({
        email: "expired-magic@example.com",
      });

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiredAt = new Date(Date.now() - 60 * 1000); // 1 min ago

      await pool.query(
        "INSERT INTO magic_link_tokens (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
        [user.id, user.email, tokenHash, expiredAt]
      );

      const res = await request(getApp())
        .post("/magic-link/verify")
        .send({ token: rawToken, email: user.email });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid, used, or expired");
    });

    test("handles user with 2FA enabled by flagging isTwoFactorEnabled", async () => {
      const { user } = await createTestUser({
        email: "2fa-magic@example.com",
        is_two_factor_enabled: true,
        two_factor_secret: "JBSWY3DPEHPK3PXP",
      });

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        "INSERT INTO magic_link_tokens (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
        [user.id, user.email, tokenHash, expiresAt]
      );

      const res = await request(getApp())
        .post("/magic-link/verify")
        .send({ token: rawToken, email: user.email });

      expect(res.status).toBe(200);
      expect(res.body.isTwoFactorEnabled).toBe(true);
    });

    test("returns 403 if user account is deactivated", async () => {
      const { user } = await createTestUser({
        email: "blocked-magic@example.com",
        is_active: false,
      });

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        "INSERT INTO magic_link_tokens (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
        [user.id, user.email, tokenHash, expiresAt]
      );

      const res = await request(getApp())
        .post("/magic-link/verify")
        .send({ token: rawToken, email: user.email });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("deactivated");
    });
  });
});
