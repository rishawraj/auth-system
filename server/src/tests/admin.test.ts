import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import http from "http";
import { handler } from "../server.js";
import { pool } from "../config/db.config.js";
import {
  cleanDatabase,
  createTestUser,
  createTestSuperUser,
  createTestSession,
} from "./setup/testDb.js";

const getApp = () => http.createServer(handler);

function getUniqueEmail(prefix = "admin-test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe("Admin & SuperUser Integration Tests (/admin/*)", () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Admin Authorization Guard", () => {
    test("allows access to /admin/paginated-users for SuperUser", async () => {
      const { accessToken } = await createTestSuperUser();

      const res = await request(getApp())
        .get("/admin/paginated-users")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeDefined();
    });

    test("blocks non-super user with 403 Forbidden", async () => {
      const { accessToken } = await createTestUser({ is_super_user: false });

      const res = await request(getApp())
        .get("/admin/paginated-users")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("not authorized");
    });

    test("blocks unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(getApp()).get("/admin/paginated-users");
      expect(res.status).toBe(401);
    });
  });

  describe("Admin User Management & Status Toggle", () => {
    test("GET /admin/paginated-users supports search and pagination", async () => {
      const { accessToken } = await createTestSuperUser();
      const uniqueKeyword = `special-${Date.now()}`;
      await createTestUser({ name: `User ${uniqueKeyword}` });

      const res = await request(getApp())
        .get(`/admin/paginated-users?search=${uniqueKeyword}&page=1&limit=5`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination.currentPage).toBe(1);
    });

    test("PATCH /admin/users/:id blocks and unblocks a user, revoking active sessions", async () => {
      const admin = await createTestSuperUser();
      const targetUser = await createTestUser({ is_active: true });
      await createTestSession(targetUser.user.id);

      // Block user
      const blockRes = await request(getApp())
        .patch(`/admin/users/${targetUser.user.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ is_active: false });

      expect(blockRes.status).toBe(200);
      expect(blockRes.body.message).toContain("blocked");

      // Verify DB: user is deactivated and active refresh tokens deleted
      const { rows: userRows } = await pool.query(
        "SELECT is_active FROM users WHERE id = $1",
        [targetUser.user.id]
      );
      expect(userRows[0].is_active).toBe(false);

      const { rows: sessionRows } = await pool.query(
        "SELECT * FROM refresh_tokens WHERE user_id = $1",
        [targetUser.user.id]
      );
      expect(sessionRows.length).toBe(0);

      // Unblock user
      const unblockRes = await request(getApp())
        .patch(`/admin/users/${targetUser.user.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({ is_active: true });

      expect(unblockRes.status).toBe(200);
      expect(unblockRes.body.message).toContain("activated");
    });

    test("DELETE /admin/users/:id soft-deletes user and writes to admin audit logs", async () => {
      const admin = await createTestSuperUser();
      const targetUser = await createTestUser();

      const res = await request(getApp())
        .delete(`/admin/users/${targetUser.user.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("marked as deleted");

      // Verify DB
      const { rows } = await pool.query(
        "SELECT is_deleted, is_active FROM users WHERE id = $1",
        [targetUser.user.id]
      );
      expect(rows[0].is_deleted).toBe(true);
      expect(rows[0].is_active).toBe(false);
    });
  });

  describe("Admin Session Inspection & Control", () => {
    test("GET /admin/users/:id/sessions lists target user active sessions", async () => {
      const admin = await createTestSuperUser();
      const targetUser = await createTestUser();
      await createTestSession(targetUser.user.id);

      const res = await request(getApp())
        .get(`/admin/users/${targetUser.user.id}/sessions`)
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.sessions.length).toBe(1);
    });

    test("POST /admin/users/:id/revoke-sessions terminates all target user sessions", async () => {
      const admin = await createTestSuperUser();
      const targetUser = await createTestUser();
      await createTestSession(targetUser.user.id);

      const res = await request(getApp())
        .post(`/admin/users/${targetUser.user.id}/revoke-sessions`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("revoked successfully");

      const { rows } = await pool.query(
        "SELECT * FROM refresh_tokens WHERE user_id = $1",
        [targetUser.user.id]
      );
      expect(rows.length).toBe(0);
    });
  });

  describe("Admin Analytics & Audit Logs", () => {
    test("GET /admin/stats/overview returns metric counters", async () => {
      const admin = await createTestSuperUser();

      const res = await request(getApp())
        .get("/admin/stats/overview")
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBeDefined();
      expect(typeof res.body.data.totalUsers).toBe("number");
    });

    test("GET /admin/recent-activity returns recent login attempts", async () => {
      const admin = await createTestSuperUser();

      const res = await request(getApp())
        .get("/admin/recent-activity")
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("GET /admin/admin-audit-logs returns audit log entries with cursor metadata", async () => {
      const admin = await createTestSuperUser();

      const res = await request(getApp())
        .get("/admin/admin-audit-logs?limit=5")
        .set("Authorization", `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toBeDefined();
      expect(res.body.data.hasMore).toBeDefined();
    });
  });
});
