import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import http from "http";
import { handler } from "../server.js";
import { pool } from "../config/db.config.js";
import {
  cleanDatabase,
  createTestUser,
  createTestSession,
} from "./setup/testDb.js";

const getApp = () => http.createServer(handler);

function getUniqueEmail(prefix = "session-user"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("Session & Token Refresh Integration Tests (/refresh-token, /sessions, /sessions/revoke, /sessions/revoke-others)", () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Token Refresh (GET /refresh-token)", () => {
    test("exchanges valid refreshToken cookie for new access token", async () => {
      const email = getUniqueEmail("refresh-user");
      const { user } = await createTestUser({ email });
      const { rawToken, jti } = await createTestSession(user.id);

      const res = await request(getApp())
        .get("/refresh-token")
        .set("Cookie", `refreshToken=${rawToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Token refreshed successfully");
      expect(res.body.accessToken).toBeDefined();

      // Verify last_used_at was updated in DB
      const { rows } = await pool.query(
        "SELECT last_used_at FROM refresh_tokens WHERE jti = $1",
        [jti]
      );
      expect(rows[0].last_used_at).toBeDefined();
    });

    test("fails when refreshToken cookie is missing", async () => {
      const res = await request(getApp()).get("/refresh-token");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Refresh token is required");
    });

    test("fails when refreshToken is invalid or tampered", async () => {
      const res = await request(getApp())
        .get("/refresh-token")
        .set("Cookie", "refreshToken=invalid.tampered.token");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or expired refresh token");
    });

    test("fails when refreshToken has been revoked in DB", async () => {
      const email = getUniqueEmail("revoked-user");
      const { user } = await createTestUser({ email });
      const { rawToken } = await createTestSession(user.id, { revoked: true });

      const res = await request(getApp())
        .get("/refresh-token")
        .set("Cookie", `refreshToken=${rawToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or revoked refresh token");
    });
  });

  describe("Session Listing (GET /sessions)", () => {
    test("lists active session for authenticated user with device metadata", async () => {
      const email = getUniqueEmail("sessions-list");
      const { user, accessToken } = await createTestUser({ email });

      const session = await createTestSession(user.id, {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
        ipAddress: "192.168.1.100",
      });

      const res = await request(getApp())
        .get("/sessions")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", `refreshToken=${session.rawToken}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toBeDefined();
      expect(res.body.sessions.length).toBe(1);

      // Verify parsed device and current session detection
      const current = res.body.sessions[0];
      expect(current.jti).toBe(session.jti);
      expect(current.is_current).toBe(true);
      expect(current.os).toContain("macOS");
      expect(current.browser).toContain("Chrome");
      expect(current.ip_address).toBe("192.168.1.100");
    });

    test("returns 401 when accessing /sessions unauthenticated", async () => {
      const res = await request(getApp()).get("/sessions");
      expect(res.status).toBe(401);
    });
  });

  describe("Session Revocation (POST /sessions/revoke & POST /sessions/revoke-others)", () => {
    test("revokes specific session by JTI", async () => {
      const email = getUniqueEmail("revoke-jti");
      const { user, accessToken } = await createTestUser({ email });
      const session = await createTestSession(user.id);

      const res = await request(getApp())
        .post("/sessions/revoke")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ jti: session.jti });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Session revoked successfully");

      // Verify in DB that session was deleted
      const { rows } = await pool.query(
        "SELECT * FROM refresh_tokens WHERE user_id = $1",
        [user.id]
      );
      expect(rows.length).toBe(0);
    });

    test("revokes all other sessions preserving the current session", async () => {
      const email = getUniqueEmail("revoke-others");
      const { user, accessToken } = await createTestUser({ email });
      const currentSession = await createTestSession(user.id);

      const res = await request(getApp())
        .post("/sessions/revoke-others")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", `refreshToken=${currentSession.rawToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("All other sessions revoked successfully");

      // Verify currentSession remains in DB
      const { rows } = await pool.query(
        "SELECT * FROM refresh_tokens WHERE user_id = $1",
        [user.id]
      );
      expect(rows.length).toBe(1);
      expect(rows[0].jti).toBe(currentSession.jti);
    });
  });
});
