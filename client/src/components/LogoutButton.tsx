import { useNavigate } from "@tanstack/react-router";

import { fetchWithAuth } from "../utils/api";
import { getType, removeToken } from "../utils/authToken";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  const navigate = useNavigate();
  const type = getType() || "email";

  const handleLogout = async () => {
    try {
      await fetchWithAuth(`/logout`, {
        method: "POST",
        credentials: "include", // Include cookies in the request
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      removeToken();
      navigate({ to: "/login" });
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="btn-press inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-500/40 px-5 py-2 text-sm font-medium text-red-300 transition-all duration-200 hover:border-red-400 hover:bg-red-500/10 hover:text-red-200"
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}
