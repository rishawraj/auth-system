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
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    console.log({ API_URL });
    if (!API_URL) {
      throw new Error("API_URL is not defined");
    }
    // Fetch the profile data from the server
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token not found.");
    }
    const response = await fetch(`${API_URL}/profile`, {
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
  console.log(profile.message.profile_pic);

  const img_url = profile.message.profile_pic || "";

  return (
    <div>
      <h1
        className="text-2xl
        font-bold
        text-gray-900
        mb-4"
      >
        Profile
      </h1>

      {/* profile pic */}
      <img
        src={img_url}
        alt="Profile"
        className="w-32 h-32 rounded-full mb-4"
      />
      <LogoutButton />
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}

function LoadingSpinner() {
  return <div>Loading profile...</div>;
}
