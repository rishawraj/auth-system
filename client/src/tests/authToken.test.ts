import { describe, test, expect, beforeEach, vi } from "vitest";

import {
  getToken,
  setToken,
  removeToken,
  isTokenExpired,
  isAuthenticated,
  getUserFromToken,
  setType,
  getType,
} from "../utils/authToken";

function createMockJwt(payload: Record<string, any>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const signature = "mock_signature";
  return `${header}.${body}.${signature}`;
}

describe("authToken utility tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Token Storage (getToken, setToken, removeToken)", () => {
    test("returns null when no token exists in localStorage", () => {
      expect(getToken()).toBeNull();
    });

    test("sets and retrieves token from localStorage", () => {
      setToken("sample_access_token_123");
      expect(getToken()).toBe("sample_access_token_123");
    });

    test("removes token from localStorage", () => {
      setToken("sample_access_token_123");
      removeToken();
      expect(getToken()).toBeNull();
    });
  });

  describe("Token Expiration (isTokenExpired & isAuthenticated)", () => {
    test("isTokenExpired returns false for future expiration", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const token = createMockJwt({ exp: futureExp });

      expect(isTokenExpired(token)).toBe(false);
    });

    test("isTokenExpired returns true for past expiration", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour in past
      const token = createMockJwt({ exp: pastExp });

      expect(isTokenExpired(token)).toBe(true);
    });

    test("isAuthenticated returns false when no token is stored", () => {
      expect(isAuthenticated()).toBe(false);
    });

    test("isAuthenticated returns false when stored token is expired", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 300;
      setToken(createMockJwt({ exp: pastExp }));

      expect(isAuthenticated()).toBe(false);
    });

    test("isAuthenticated returns true when stored token is valid", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 900;
      setToken(createMockJwt({ exp: futureExp }));

      expect(isAuthenticated()).toBe(true);
    });
  });

  describe("Token Payload Extraction (getUserFromToken)", () => {
    test("returns null when no token is stored", () => {
      expect(getUserFromToken()).toBeNull();
    });

    test("extracts user payload from valid token", () => {
      const token = createMockJwt({
        email: "alice@example.com",
        is_super_user: true,
        exp: Math.floor(Date.now() / 1000) + 1000,
      });
      setToken(token);

      const user = getUserFromToken();
      expect(user).not.toBeNull();
      expect(user?.email).toBe("alice@example.com");
      expect(user?.is_super_user).toBe(true);
    });

    test("returns null and logs error on malformed token payload", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      setToken("malformed.invalidpayload.signature");

      expect(getUserFromToken()).toBeNull();
    });
  });

  describe("Auth Type Storage (setType & getType)", () => {
    test("sets and gets auth provider type ('email' | 'google')", () => {
      expect(getType()).toBeNull();

      setType("email");
      expect(getType()).toBe("email");

      setType("google");
      expect(getType()).toBe("google");
    });
  });
});
