import { createFileRoute } from "@tanstack/react-router";
import UserRegistrationForm from "../components/UserRegistrationForm";

export const Route = createFileRoute("/register")({
  component: UserRegistrationForm,
});
