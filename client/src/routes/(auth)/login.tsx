import { createFileRoute, redirect } from "@tanstack/react-router";
import Cookies from "js-cookie";

import UserLoginForm from "../../components/UserLoginForm";
import { getToken } from "../../utils/authToken";

export const Route = createFileRoute("/(auth)/login")({
  beforeLoad: async () => {
    // const token = Cookies.get("token");
    const token = getToken();
    console.log("Token from cookies:", token);
    if (token) {
      throw redirect({ to: "/profile" });
    }
  },
  component: UserLoginForm,
});
