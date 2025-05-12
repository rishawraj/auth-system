import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { LogoutButton } from "../../../components/LogoutButton";
import { User } from "../../../types/auth";
import { fetchWithAuth } from "../../../utils/api";

export const Route = createFileRoute("/_auth/profile/")({
  loader: async () => {
    // fetchWithAuth will handle token refresh and errors automatically
    // type data in console data = user:{user:{..}}
    // const resonse = await fetch(`${import.meta.env.VITE_API_BASE_URL}//`)

    type ProfileResponse = {
      user: User;
    };

    try {
      const data = await fetchWithAuth<ProfileResponse>("/profile");
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  },

  pendingComponent: LoadingSpinner,
  pendingMs: 500, // Show loading after 500ms
  pendingMinMs: 300, // Ensure loading is shown for at least 300ms
  component: RouteComponent,
});

function RouteComponent() {
  const profile = useLoaderData({ from: "/_auth/profile/" });
  console.log(profile);
  // if (!profile) {
  //   return <div>Error loading profile</div>;
  // }

  const img_url = (profile && profile.user.profile_pic) || "";

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Profile</h1>

      {/* profile pic */}
      <img
        src={img_url}
        alt="Profile"
        className="mb-4 h-32 w-32 rounded-full"
      />
      <button
        className="rounded bg-blue-500 px-4 py-2 text-white transition duration-200 ease-in-out hover:bg-blue-600"
        onClick={() => {
          window.location.href = "/profile/edit";
        }}
      >
        edit
      </button>
      <LogoutButton />
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}

function LoadingSpinner() {
  return <div>Loading profile...</div>;
}
