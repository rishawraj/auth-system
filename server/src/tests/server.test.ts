import { describe, test, expect, afterAll, vi, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import http from "http";
import { handler } from "../server.js";
import { pool } from "../config/db.config.js";

const server = http.createServer(handler);

const testUser = {
  name: "Test User",
  email: `test-${Date.now()}@example.com`,
  password: "password123",
};

beforeAll(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  await pool.query("DELETE FROM users WHERE email = $1 OR pending_email = $1", [
    testUser.email,
  ]);
  await pool.query("TRUNCATE TABLE rate_limits");
});

beforeEach(async () => {
  try {
    await pool.query("TRUNCATE TABLE rate_limits");
  } catch (err) {
    // ignore
  }
});

afterAll(async () => {
  try {
    await pool.query("DELETE FROM users WHERE email = $1 OR pending_email = $1", [
      testUser.email,
    ]);
  } catch (error) {
    // ignore
  }

  server.close();
  pool.end().catch(() => {});
  vi.restoreAllMocks();
});

describe("Server basic routes", () => {
  test("GET / (unknown route) should return 404", async () => {
    const res = await request(server).get("/unknown-route");
    expect(res.statusCode).toBe(404);
    expect(res.text).toContain("Not Found");
  });

  test("GET /health should return 200", async () => {
    const res = await request(server).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Server is healthy");
  });
});

describe("Authentication System Tests", () => {
  describe("User Registration & Verification", () => {
    test("should register a new user successfully", async () => {
      const res = await request(server).post("/register").send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe(
        "If the email is valid, a verification code has been sent."
      );
      expect(res.body.pending_email).toBe(testUser.email);
      expect(res.body.qrcodeImageUrl).toBeDefined();
    });

    test("should mark user as verified in database for login tests", async () => {
      const updateRes = await pool.query(
        "UPDATE users SET email = pending_email, pending_email = NULL, verification_code = NULL WHERE pending_email = $1 RETURNING id",
        [testUser.email]
      );
      expect(updateRes.rowCount).toBeGreaterThan(0);
    });
  });

  describe("User Login", () => {
    test("should login successfully with correct credentials", async () => {
      const res = await request(server)
        .post("/login")
        .set("X-Forwarded-For", "127.0.0.1")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.accessToken).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    test("should fail with incorrect password", async () => {
      const res = await request(server)
        .post("/login")
        .set("X-Forwarded-For", "127.0.0.2")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    test("should fail with non-existent email", async () => {
      const res = await request(server)
        .post("/login")
        .set("X-Forwarded-For", "127.0.0.3")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });
  });
});

describe("Server admin routes", () => {
  test("GET /admin/health should return 200", async () => {
    const res = await request(server).get("/admin/health");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Server is healthy");
  });
});
