import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { fetchWithAuth } from "../../utils/api";

interface MeResponse {
  id: string;
  email: string;
  name: string;
  is_super_user: boolean;
}

export const Route = createFileRoute("/_auth/_isAdmin")({
  beforeLoad: async () => {
    try {
      const user = await fetchWithAuth<MeResponse>("/me");

      if (!user.is_super_user) {
        toast.error("You are not authorized to access this page.");
        throw redirect({ to: "/profile" });
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
