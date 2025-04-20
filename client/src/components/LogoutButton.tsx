import { useNavigate } from "@tanstack/react-router";
import Cookies from "js-cookie";

export function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call the server-side logout endpoint
      await fetch("http://localhost:3000/logout", {
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

  return <button onClick={handleLogout}>Logout</button>;
}
