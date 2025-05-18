import { describe, test, expect, afterAll, vi, beforeAll } from "vitest";
import request from "supertest";
import http from "http";
import { handler } from "../server.js";
import { pool } from "../config/db.config.js";

const server = http.createServer(handler);

// Disable console output before tests vitest
console.log = vi.fn();
console.error = vi.fn();

beforeAll(async () => {
  // Clean up the database before running tests
  await pool.query("DELETE FROM users WHERE email = $1", [testUser.email]);
});

afterAll(async () => {
  // Clean up the database after running tests
  await pool.query("DELETE FROM users WHERE email = $1", [testUser.email]);
  server.close();
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

const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
};

describe("Authentication System Tests", () => {
  describe("User Registration", () => {
    test("should register a new user successfully", async () => {
      const res = await request(server).post("/register").send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.accessToken).toBeDefined();
    });

    test("should not allow duplicate email registration", async () => {
      const res = await request(server).post("/register").send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("User with this email already exists");
    });
  });

  describe("User Login", () => {
    test("should login successfully with correct credentials", async () => {
      const res = await request(server).post("/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.accessToken).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    test("should fail with incorrect password", async () => {
      const res = await request(server).post("/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    test("should fail with non-existent email", async () => {
      const res = await request(server).post("/login").send({
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
