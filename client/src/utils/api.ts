import { redirect } from "@tanstack/react-router";

import { getToken, getType, setToken } from "./authToken";

const API_URL = import.meta.env.VITE_API_BASE_URL;

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function refreshAccessToken(): Promise<string> {
  console.log("Refreshing token");
  const type = getType();

  if (type === "google") {
    return await refreshGoogleToken();
  } else if (type === "email") {
    return await refreshEmailToken();
  } else {
    throw new Error("Invalid token type");
  }
}

async function refreshGoogleToken(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/google/refresh-token`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    console.error("Failed to refresh token:", response.statusText);
    throw new ApiError(response.status, "Failed to refresh token");
  }

  const data = await response.json();
  console.log("Refreshed token");
  return data.accessToken;
}

async function refreshEmailToken(): Promise<string> {
  const response = await fetch(`${API_URL}/refresh-token`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    console.error("Failed to refresh token:", response.statusText);
    throw new ApiError(response.status, "Failed to refresh token");
  }

  const data = await response.json();
  console.log("Refreshed token");
  return data.accessToken;
}

export async function fetchWithAuth<T>(
  url: string,
  options: ApiOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("API_URL is not defined");
  }

  const { skipAuth = false, ...fetchOptions } = options;

  const token = getToken();

  if (!skipAuth && !token) {
    throw redirect({ to: "/login" });
  }

  const headers = new Headers(fetchOptions.headers);
  if (!skipAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      try {
        // Try to refresh the token
        const newToken = await refreshAccessToken();
        setToken(newToken);

        // Retry the original request with new token
        headers.set("Authorization", `Bearer ${newToken}`);
        const retryResponse = await fetch(`${API_URL}${url}`, {
          ...fetchOptions,
          headers,
        });

        if (!retryResponse.ok) {
          throw new ApiError(
            retryResponse.status,
            "Request failed after token refresh",
          );
        }

        return retryResponse.json();
      } catch (error) {
        console.error("Token refresh failed:", error);
        // If refresh fails, remove token and redirect to login
        // removeToken();
        // throw redirect({ to: "/login" });
      }
    }

    if (!response.ok) {
      throw new ApiError(response.status, "Request failed");
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new ApiError(500, error.message);
    }
    throw new ApiError(500, "Unknown error occurred");
  }
}
