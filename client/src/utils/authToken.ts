export const getToken = (): string | null => {
  // const token = Cookies.get("token");
  const token = localStorage.getItem("token"); // Retrieve token from localStorage
  if (!token) {
    return null;
  }
  return token;
};

export const setToken = (token: string): void => {
  // Cookies.set("token", token, { expires: 7 }); // Set cookie to expire in 7 days
  localStorage.setItem("token", token); // Store token in localStorage
};

export const removeToken = (): void => {
  // Cookies.remove("token");
  localStorage.removeItem("token"); // Remove token from localStorage
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

export function setType(type: string) {
  if (getType() !== null) localStorage.removeItem("type");
  localStorage.setItem("type", type);
}

export function getType() {
  return localStorage.getItem("type");
}
