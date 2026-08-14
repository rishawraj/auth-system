import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";

import { fetchWithAuth } from "../utils/api";
import * as authToken from "../utils/authToken";

// Mock @tanstack/react-router redirect
vi.mock("@tanstack/react-router", () => ({
  redirect: vi.fn(({ to }) => new Error(`REDIRECT_TO:${to}`)),
}));

describe("fetchWithAuth API utility", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("throws redirect to /login when skipAuth is false and no token is present", async () => {
    vi.spyOn(authToken, "getToken").mockReturnValue(null);

    await expect(fetchWithAuth("/profile")).rejects.toThrow(
      "REDIRECT_TO:/login",
    );
  });

  test("sends request with Authorization Bearer header when token is present", async () => {
    vi.spyOn(authToken, "getToken").mockReturnValue("valid_token_123");

    const mockResponseData = { id: "user_1", name: "Alice" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponseData,
    } as Response);

    const data = await fetchWithAuth<typeof mockResponseData>("/profile");

    expect(data).toEqual(mockResponseData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/profile"),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  test("omits Authorization header when skipAuth is true", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "OK" }),
    } as Response);

    await fetchWithAuth("/health", { skipAuth: true });

    expect(global.fetch).toHaveBeenCalled();
  });

  test("handles 401 by attempting token refresh and retrying original request", async () => {
    vi.spyOn(authToken, "getToken").mockReturnValue("expired_token");
    vi.spyOn(authToken, "getType").mockReturnValue("email");
    const setTokenSpy = vi.spyOn(authToken, "setToken");

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      // First call to /profile returns 401
      if (url.includes("/profile") && callCount === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: "Token expired" }),
        } as Response;
      }
      // Second call is to /refresh-token
      if (url.includes("/refresh-token")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ accessToken: "fresh_new_token_456" }),
        } as Response;
      }
      // Third call is the retried /profile request
      if (url.includes("/profile") && callCount === 3) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ message: "Success after refresh" }),
        } as Response;
      }
      return { ok: false, status: 500 } as Response;
    });

    const result = await fetchWithAuth<{ message: string }>("/profile");

    expect(result.message).toBe("Success after refresh");
    expect(setTokenSpy).toHaveBeenCalledWith("fresh_new_token_456");
  });

  test("removes token and redirects to /login when 401 refresh token attempt fails", async () => {
    vi.spyOn(authToken, "getToken").mockReturnValue("expired_token");
    vi.spyOn(authToken, "getType").mockReturnValue("email");
    const removeTokenSpy = vi.spyOn(authToken, "removeToken");

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/profile")) {
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      }
      if (url.includes("/refresh-token")) {
        return {
          ok: false,
          status: 401,
          statusText: "Unauthorized",
        } as Response;
      }
      return { ok: false, status: 500 } as Response;
    });

    await expect(fetchWithAuth("/profile")).rejects.toThrow(
      "REDIRECT_TO:/login",
    );
    expect(removeTokenSpy).toHaveBeenCalled();
  });

  test("throws ApiError with error message on API failure (e.g., 400 or 500)", async () => {
    vi.spyOn(authToken, "getToken").mockReturnValue("valid_token");

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Invalid request payload" }),
    } as Response);

    await expect(fetchWithAuth("/bad-endpoint")).rejects.toThrow(
      "Invalid request payload",
    );
  });
});
