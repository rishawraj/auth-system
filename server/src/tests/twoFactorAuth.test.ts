import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import http from "http";
import { TOTP, Secret } from "otpauth";
import { handler } from "../server.js";
import { pool } from "../config/db.config.js";
import { cleanDatabase, createTestUser } from "./setup/testDb.js";
import { generateBackupCodes } from "../utils/helpers.js";

const getApp = () => http.createServer(handler);

function getUniqueEmail(prefix = "2fa-user"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("Two-Factor Authentication Integration Tests (/2fa/enable, /2fa/verify, /2fa/validate-backup, /2fa/disable)", () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("2FA Setup & Activation (/2fa/enable & /2fa/verify)", () => {
    test("GET /2fa/enable returns QR code image URI and temporary 2FA secret", async () => {
      const email = getUniqueEmail("enable-2fa");
      const { user, accessToken } = await createTestUser({ email });

      const res = await request(getApp())
        .get("/2fa/enable")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user.id);
      expect(res.body.secret).toBeDefined();
      expect(res.body.qrcodeImageUrl).toContain("data:image/png;base64");

      // Verify DB has tmp_two_factor_secret stored
      const { rows } = await pool.query(
        "SELECT tmp_two_factor_secret, is_two_factor_enabled FROM users WHERE id = $1",
        [user.id]
      );
      expect(rows[0].tmp_two_factor_secret).toBe(res.body.secret);
      expect(rows[0].is_two_factor_enabled).toBe(false);
    });

    test("POST /2fa/verify activates 2FA with valid TOTP code and returns backup codes", async () => {
      const email = getUniqueEmail("verify-2fa");
      const { user, accessToken } = await createTestUser({ email });

      // Step 1: Enable 2FA to generate secret
      const enableRes = await request(getApp())
        .get("/2fa/enable")
        .set("Authorization", `Bearer ${accessToken}`);

      const secretBase32 = enableRes.body.secret;

      // Generate valid TOTP code
      const totp = new TOTP({
        issuer: "auth-system",
        label: user.email,
        secret: secretBase32,
        digits: 6,
        period: 30,
      });
      const validCode = totp.generate();

      // Step 2: Verify TOTP code
      const verifyRes = await request(getApp())
        .post("/2fa/verify")
        .send({
          id: user.id,
          code: validCode,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.message).toBe("2fa enabled");
      expect(verifyRes.body.rawCodes).toBeDefined();
      expect(verifyRes.body.rawCodes.length).toBe(10);

      // Verify DB has is_two_factor_enabled = true and backup codes stored
      const { rows } = await pool.query(
        "SELECT is_two_factor_enabled, two_factor_secret FROM users WHERE id = $1",
        [user.id]
      );
      expect(rows[0].is_two_factor_enabled).toBe(true);
      expect(rows[0].two_factor_secret).toBe(secretBase32);

      const { rows: backupCodes } = await pool.query(
        "SELECT * FROM two_fa_backup_codes WHERE user_id = $1",
        [user.id]
      );
      expect(backupCodes.length).toBe(10);
    });

    test("POST /2fa/verify rejects invalid TOTP code", async () => {
      const email = getUniqueEmail("invalid-totp");
      const { user, accessToken } = await createTestUser({ email });

      await request(getApp())
        .get("/2fa/enable")
        .set("Authorization", `Bearer ${accessToken}`);

      const res = await request(getApp())
        .post("/2fa/verify")
        .send({
          id: user.id,
          code: "000000", // Invalid code
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid 2fa code");
    });
  });

  describe("Backup Codes Validation (/2fa/validate-backup)", () => {
    test("validates single-use backup code and marks it as used", async () => {
      const email = getUniqueEmail("backup-code");
      const { user, accessToken } = await createTestUser({
        email,
        is_two_factor_enabled: true,
      });

      // Generate and seed backup codes
      const generatedCodes = await generateBackupCodes(5);
      for (const c of generatedCodes) {
        await pool.query(
          "INSERT INTO two_fa_backup_codes (user_id, code_hash) VALUES ($1, $2)",
          [user.id, c.hash]
        );
      }

      const codeToUse = generatedCodes[0].raw;

      // 1. First validation attempt with backup code -> Success
      const firstUseRes = await request(getApp())
        .post("/2fa/validate-backup")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ code: codeToUse });

      expect(firstUseRes.status).toBe(200);
      expect(firstUseRes.body.message).toBe("Backup code validated successfully");

      // 2. Second validation attempt with SAME backup code -> Rejection (Single-use enforcement)
      const secondUseRes = await request(getApp())
        .post("/2fa/validate-backup")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ code: codeToUse });

      expect(secondUseRes.status).toBe(400);
      expect(secondUseRes.body.error).toBe("Invalid or already used backup code");
    });
  });

  describe("Disable 2FA (/2fa/disable)", () => {
    test("disables 2FA with correct user password and removes backup codes", async () => {
      const email = getUniqueEmail("disable-2fa");
      const password = "ValidPassword123!";
      const { user, accessToken } = await createTestUser({
        email,
        password,
        is_two_factor_enabled: true,
        two_factor_secret: "JBSWY3DPEHPK3PXP",
      });

      // Insert test backup codes
      const generatedCodes = await generateBackupCodes(3);
      for (const c of generatedCodes) {
        await pool.query(
          "INSERT INTO two_fa_backup_codes (user_id, code_hash) VALUES ($1, $2)",
          [user.id, c.hash]
        );
      }

      const res = await request(getApp())
        .post("/2fa/disable")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ password });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("2fa disabled");

      // Verify DB state
      const { rows: userRows } = await pool.query(
        "SELECT is_two_factor_enabled, two_factor_secret FROM users WHERE id = $1",
        [user.id]
      );
      expect(userRows[0].is_two_factor_enabled).toBe(false);
      expect(userRows[0].two_factor_secret).toBeNull();

      const { rows: backupRows } = await pool.query(
        "SELECT * FROM two_fa_backup_codes WHERE user_id = $1",
        [user.id]
      );
      expect(backupRows.length).toBe(0);
    });

    test("fails to disable 2FA with incorrect password", async () => {
      const email = getUniqueEmail("disable-wrong-pwd");
      const { accessToken } = await createTestUser({
        email,
        password: "RealPassword123!",
        is_two_factor_enabled: true,
      });

      const res = await request(getApp())
        .post("/2fa/disable")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ password: "WrongPassword999!" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid password");
    });
  });
});
