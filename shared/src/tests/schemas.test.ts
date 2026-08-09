import { describe, test, expect } from "vitest";
import {
  LoginRequestSchema,
  RegisterRequestSchema,
} from "../api/auth.js";
import { SessionSchema } from "../models/user.js";

describe("Shared Zod Schemas", () => {
  describe("LoginRequestSchema", () => {
    test("validates valid email and password", () => {
      const result = LoginRequestSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    test("fails on invalid email format", () => {
      const result = LoginRequestSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    test("fails on short password", () => {
      const result = LoginRequestSchema.safeParse({
        email: "user@example.com",
        password: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RegisterRequestSchema", () => {
    test("validates complete registration payload", () => {
      const result = RegisterRequestSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "secretpassword",
      });
      expect(result.success).toBe(true);
    });

    test("fails when name is missing", () => {
      const result = RegisterRequestSchema.safeParse({
        name: "",
        email: "john@example.com",
        password: "secretpassword",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("SessionSchema", () => {
    test("validates session object structure", () => {
      const sessionData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        jti: "random-jti-uuid",
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        browser: "Chrome 120",
        os: "macOS 14",
        device: "Desktop",
        issued_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        is_current: true,
      };

      const result = SessionSchema.safeParse(sessionData);
      expect(result.success).toBe(true);
    });
  });
});
