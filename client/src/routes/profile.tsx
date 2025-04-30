import {
  createFileRoute,
  redirect,
  useLoaderData,
} from "@tanstack/react-router";
import Cookies from "js-cookie";
import { LogoutButton } from "../components/LogoutButton";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    const token = Cookies.get("token");
    console.log({ token });
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },

  loader: async () => {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token not found.");
    }
    const response = await fetch("http://localhost:3000/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        Cookies.remove("token");
        throw redirect({ to: "/login" });
      }
      throw new Error("Failed to fetch profile data");
    }

    return response.json();
  },
  pendingComponent: LoadingSpinner,
  pendingMs: 500, // Show loading after 500ms
  pendingMinMs: 300, // Ensure loading is shown for at least 300ms
  component: RouteComponent,
});

function RouteComponent() {
  const profile = useLoaderData({ from: "/profile" });

  return (
    <div>
      <LogoutButton />
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}

function LoadingSpinner() {
  return <div>Loading profile...</div>;
}
