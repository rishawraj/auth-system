import {
  useLoaderData,
  createFileRoute,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import Cookies from "js-cookie";

import { User } from "../../../../../types/auth";

export const Route = createFileRoute("/_auth/_isAdmin/admin/users/")({
  beforeLoad: async () => {
    const token = Cookies.get("token");
    console.log({ token });
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },

  loader: async () => {
    const token = Cookies.get("token");
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    console.log({ token });
    if (!token) {
      throw new Error("Authentication token not found.");
    }
    const response = await fetch(`${API_URL}/admin/users`, {
      method: "GET",
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
  component: RouteComponent,
  errorComponent: () => <div>Something went wrong</div>,
});

function RouteComponent() {
  const data = useLoaderData({ from: "/_auth/_isAdmin/admin/users/" });
  console.log("Admin Health Data:", data.data.rows);
  const navigate = useNavigate();

  const handleUserClick = (userId: string) => {
    console.log("User ID:", userId);
    // Navigate to the user details page
    // You can use the router's navigate function or any other method to navigate
    // For example, if you're using react-router-dom:
    navigate({ to: `/admin/users/${userId}` });
  };

  return (
    <div>
      <h1>Admin</h1>
      <p>This is the admin page.</p>
      <div>
        <h3>All users</h3>
        {data.data.rows.length > 0 ? (
          <ul>
            {data.data.rows.map((user: User) => (
              <li className="m-2 flex gap-2 bg-amber-500 p-2" key={user.id}>
                <p>{user.id}</p>
                <p>{user.name}</p>
                <p>{user.email}</p>
                <button
                  className="m-2 cursor-pointer rounded-md border-2 border-black bg-green-400 p-2"
                  onClick={() => handleUserClick(user.id)}
                >
                  go to user
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </div>
  );
}
