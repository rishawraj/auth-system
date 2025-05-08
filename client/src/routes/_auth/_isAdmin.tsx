import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { getUserFromToken } from "../../utils/authToken";

export const Route = createFileRoute("/_auth/_isAdmin")({
  beforeLoad: async () => {
    const user = getUserFromToken();
    console.log("User from token:", user);
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (!user.is_super_user) {
      console.log("User is not super user");
      toast.error("You are not authorized to access this page.");
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
