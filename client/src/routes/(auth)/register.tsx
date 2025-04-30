import { createFileRoute, redirect } from "@tanstack/react-router";
import UserRegistrationForm from "../components/UserRegistrationForm";
import Cookies from "js-cookie";

export const Route = createFileRoute("/(auth)/register")({
  beforeLoad: async () => {
    const token = Cookies.get("token");
    if (token) {
      throw redirect({ to: "/profile" });
    }
  },
  component: UserRegistrationForm,
});
