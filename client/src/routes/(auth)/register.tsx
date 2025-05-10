import { createFileRoute, redirect } from "@tanstack/react-router";
import Cookies from "js-cookie";

import UserRegistrationForm from "../../components/UserRegistrationForm";
import { getToken } from "../../utils/authToken";

export const Route = createFileRoute("/(auth)/register")({
  beforeLoad: async () => {
    // const token = Cookies.get("token");
    const token = getToken();
    if (token) {
      throw redirect({ to: "/profile" });
    }
  },
  component: UserRegistrationForm,
});
