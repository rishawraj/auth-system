import { useNavigate } from "@tanstack/react-router";
import Cookies from "js-cookie";

export function LogoutButton() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleLogout = async () => {
    try {
      // Call the server-side logout endpoint
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include", // Include cookies in the request
      });

      // Remove the token from cookies on the client side
      Cookies.remove("token");

      // Redirect to the login page
      navigate({ to: "/login" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button
      className="p-2 bg-red-300 text-white cursor-pointer"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}
