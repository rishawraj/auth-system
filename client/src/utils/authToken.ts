import Cookies from "js-cookie";

export const getToken = (): string | null => {
  const token = Cookies.get("token");
  if (!token) {
    return null;
  }
  return token;
};

export const setToken = (token: string): void => {
  Cookies.set("token", token, { expires: 7 }); // Set cookie to expire in 7 days
};

export const removeToken = (): void => {
  Cookies.remove("token");
};

export const isTokenExpired = (token: string): boolean => {
  const payload = JSON.parse(atob(token.split(".")[1]));
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() > expirationTime;
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) {
    return false;
  }
  return !isTokenExpired(token);
};

// utils/auth.ts
export function getUserFromToken(): {
  email: string;
  is_super_user: boolean;
} | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch (err) {
    console.error("Failed to parse token", err);
    return null;
  }
}
