import { useNavigate } from "@tanstack/react-router";

import { getToken, getType, removeToken } from "../utils/authToken";

export function LogoutButton() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const type = getType();

  const handleLogout = async () => {
    try {
      // Call the server-side logout endpoint
      const token = getToken();
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include", // Include cookies in the request
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      // Remove the token from cookies on the client side
      removeToken();

      // Redirect to the login page
      navigate({ to: "/login" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button
      className="cursor-pointer bg-red-300 p-2 text-white"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}
