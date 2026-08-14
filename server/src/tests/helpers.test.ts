import { describe, test, expect, beforeAll, afterAll } from "vitest";
import jwt from "jsonwebtoken";
import {
  generateSixDigitCodeWithExpiry,
  isCodeExpired,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateBackupCodes,
  normalizeIP,
  parseCookies,
  setServerCookie,
  logLoginAttempt,
} from "../utils/helpers.js";
import { parseDevice } from "../utils/deviceParser.js";
import { env } from "../config/env.js";
import { pool } from "../config/db.config.js";
import { cleanDatabase, createTestUser } from "./setup/testDb.js";
import http from "http";

describe("Helpers & Utility Unit Tests", () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("Verification Code & Expiry Helpers", () => {
    test("generateSixDigitCodeWithExpiry generates a 6-digit numeric string and valid future expiry", () => {
      const { code, expiresAt } = generateSixDigitCodeWithExpiry(60);

      expect(code).toMatch(/^\d{6}$/);
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test("isCodeExpired correctly checks expiration dates", () => {
      const pastDate = new Date(Date.now() - 5000);
      const futureDate = new Date(Date.now() + 60000);

      expect(isCodeExpired(pastDate)).toBe(true);
      expect(isCodeExpired(futureDate)).toBe(false);
    });
  });

  describe("JWT & Token Hashing Helpers", () => {
    test("generateAccessToken signs payload with ACCESS_TOKEN_SECRET", () => {
      const payload = { id: "user-123", email: "test@example.com" };
      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as any;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });

    test("generateRefreshToken signs payload with REFRESH_TOKEN_SECRET", () => {
      const payload = { id: "user-123", jti: "jti-uuid-456" };
      const token = generateRefreshToken(payload);

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as any;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.jti).toBe(payload.jti);
    });

    test("hashToken creates deterministic SHA-256 hex string", () => {
      const token = "sample_raw_token_xyz";
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(token);
    });
  });

  describe("Backup Codes Generator", () => {
    test("generateBackupCodes returns 10 formatted codes and SHA-256 hashes", async () => {
      const codes = await generateBackupCodes(10);

      expect(codes).toHaveLength(10);
      codes.forEach(({ raw, hash }) => {
        expect(raw).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
        expect(hash).toHaveLength(64);
        expect(hashToken(raw)).toBe(hash);
      });
    });
  });

  describe("IP and Cookie Parsing", () => {
    test("normalizeIP strips IPv6 prefixes", () => {
      expect(normalizeIP("::ffff:192.168.1.1")).toBe("192.168.1.1");
      expect(normalizeIP("127.0.0.1")).toBe("127.0.0.1");
      expect(normalizeIP(undefined)).toBeUndefined();
    });

    test("parseCookies parses cookie header into key-value map", () => {
      const req = {
        headers: {
          cookie: "refreshToken=token123; session_id=abc; theme=dark",
        },
      } as unknown as http.IncomingMessage;

      const parsed = parseCookies(req);
      expect(parsed).toEqual({
        refreshToken: "token123",
        session_id: "abc",
        theme: "dark",
      });
    });

    test("setServerCookie attaches formatted Set-Cookie header", () => {
      let setHeaderValue: string | undefined;
      const res = {
        setHeader: (_name: string, value: string) => {
          setHeaderValue = value;
        },
      } as unknown as http.ServerResponse;

      setServerCookie({
        name: "refreshToken",
        value: "secret_val_123",
        res,
        isProduction: false,
        maxAge: 3600,
      });

      expect(setHeaderValue).toContain("refreshToken=secret_val_123");
      expect(setHeaderValue).toContain("HttpOnly");
      expect(setHeaderValue).toContain("SameSite=Strict");
      expect(setHeaderValue).toContain("Max-Age=3600");
    });
  });

  describe("Database Login Activity Logger", () => {
    test("logLoginAttempt records successful and failed login attempts in DB", async () => {
      const { user } = await createTestUser();

      await logLoginAttempt({
        userId: user.id,
        email: user.email,
        success: false,
        ip: "127.0.0.1",
        userAgent: "TestAgent/1.0",
      });

      await logLoginAttempt({
        userId: user.id,
        email: user.email,
        success: true,
        ip: "127.0.0.1",
        userAgent: "TestAgent/1.0",
      });

      const { rows } = await pool.query(
        "SELECT * FROM login_activity WHERE user_id = $1 ORDER BY created_at ASC",
        [user.id]
      );

      expect(rows.length).toBe(2);
      expect(rows[0].success).toBe(false);
      expect(rows[0].attempt_count).toBe(1);
      expect(rows[1].success).toBe(true);
      expect(rows[1].attempt_count).toBe(1);
    });

    test("cleanDatabase removes test users and referenced records", async () => {
      const { user } = await createTestUser();
      expect(user.id).toBeDefined();

      await cleanDatabase();

      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
        user.id,
      ]);
      expect(rows.length).toBe(0);
    });
  });

  describe("Device Parser Utility (parseDevice)", () => {
    test("parses Chrome on macOS user agent", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      const result = parseDevice(ua);

      expect(result.browser).toContain("Chrome");
      expect(result.os).toContain("macOS");
      expect(result.device).toBeDefined();
    });

    test("parses iPhone user agent as Mobile", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1";
      const result = parseDevice(ua);

      expect(result.browser).toContain("Safari");
      expect(result.os).toContain("iOS");
      expect(result.device).toContain("iPhone");
    });

    test("returns fallback default values when user agent is null or empty", () => {
      const resultNull = parseDevice(null);
      expect(resultNull).toEqual({
        browser: "Unknown Browser",
        os: "Unknown OS",
        device: "Desktop",
      });

      const resultEmpty = parseDevice("");
      expect(resultEmpty).toEqual({
        browser: "Unknown Browser",
        os: "Unknown OS",
        device: "Desktop",
      });
    });
  });
});
