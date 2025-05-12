import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getToken } from "../utils/authToken";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const token = getToken();

    console.log({ token });

    if (!token) {
      throw redirect({ to: "/login" });
    }

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    if (!API_URL) {
      throw new Error("API_URL is not defined");
    }
  },

  component: () => <Outlet />,
});
