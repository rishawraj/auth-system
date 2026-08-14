import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import http from "http";
import { handler } from "../server.js";
import { pool } from "../config/db.config.js";
import { cleanDatabase, createTestUser } from "./setup/testDb.js";
import { setupGoogleOAuthMock } from "./setup/mocks.js";

const getApp = () => http.createServer(handler);

function getUniqueEmail(prefix = "google-user"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("Google OAuth Integration Tests (/auth/google, /auth/google/callback)", () => {
  let googleMock: ReturnType<typeof setupGoogleOAuthMock>;

  beforeAll(async () => {
    googleMock = setupGoogleOAuthMock();
    await cleanDatabase();
  });

  afterAll(async () => {
    googleMock.restore();
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Google Auth Initiation (GET /auth/google)", () => {
    test("redirects to Google OAuth consent screen with 302 Location", async () => {
      const res = await request(getApp()).get("/auth/google");

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("accounts.google.com");
    });
  });

  describe("Google Auth Callback (GET /auth/google/callback)", () => {
    test("creates new verified user and sets session cookie on valid OAuth callback", async () => {
      const mockEmail = getUniqueEmail("oauth-new");
      googleMock.restore();
      googleMock = setupGoogleOAuthMock({
        email: mockEmail,
        sub: `google-sub-${Date.now()}`,
        name: "New Google User",
      });

      const res = await request(getApp())
        .get("/auth/google/callback?code=valid_mock_google_auth_code");

      expect(res.status).toBe(302);

      // Verify Set-Cookie header contains refreshToken
      const rawCookies = res.headers["set-cookie"];
      const cookieArray = Array.isArray(rawCookies)
        ? rawCookies
        : typeof rawCookies === "string"
        ? [rawCookies]
        : [];
      expect(cookieArray.some((c: string) => c.includes("refreshToken="))).toBe(true);

      // Verify user in database
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND oauth_provider = 'google'",
        [mockEmail]
      );
      expect(rows.length).toBe(1);
      expect(rows[0].is_active).toBe(true);
      expect(rows[0].name).toBe("New Google User");
    });

    test("links to existing local account when email matches", async () => {
      const existingEmail = getUniqueEmail("existing-local");
      const { user } = await createTestUser({ email: existingEmail });

      googleMock.restore();
      googleMock = setupGoogleOAuthMock({
        email: existingEmail,
        sub: `google-link-${Date.now()}`,
        name: "Existing Local User",
      });

      const res = await request(getApp())
        .get("/auth/google/callback?code=mock_link_code");

      expect(res.status).toBe(302);

      // Verify user in database now has oauth_provider = 'google'
      const { rows } = await pool.query(
        "SELECT oauth_provider, oauth_id FROM users WHERE id = $1",
        [user.id]
      );
      expect(rows[0].oauth_provider).toBe("google");
      expect(rows[0].oauth_id).toBeDefined();
    });

    test("fails callback when no code is provided in query params", async () => {
      const res = await request(getApp()).get("/auth/google/callback");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No code provided");
    });
  });
});
