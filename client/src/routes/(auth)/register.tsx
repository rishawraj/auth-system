import { createFileRoute, redirect } from "@tanstack/react-router";

import NavBar from "../../components/NavBar-test";
import UserRegistrationForm from "../../components/UserRegistrationForm";
import { getToken } from "../../utils/authToken";

export const Route = createFileRoute("/(auth)/register")({
  beforeLoad: async () => {
    const token = getToken();
    if (token) {
      throw redirect({ to: "/profile" });
    }
  },
  component: Index,
});

function Index() {
  return (
    <>
      <NavBar />
      <UserRegistrationForm />
    </>
  );
}
