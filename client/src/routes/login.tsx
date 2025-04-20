import { createFileRoute, redirect } from "@tanstack/react-router";
import UserLoginForm from "../components/UserLoginForm";
import Cookies from "js-cookie";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const token = Cookies.get("token");
    if (token) {
      throw redirect({ to: "/profile" });
    }
  },
  component: UserLoginForm,
});
