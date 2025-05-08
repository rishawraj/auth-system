import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { getToken } from "../../../../../utils/authToken";

export const Route = createFileRoute("/_auth/_isAdmin/admin/users/$postId")({
  loader: async ({ params }) => {
    const token = getToken();
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    if (!token) {
      throw new Error("You must be logged in to view this page");
    }

    const postId = params.postId;
    console.log("Loading data for user ID:", postId);

    try {
      const response = await fetch(`${API_URL}/admin/users/${postId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status);

      if (response.status === 404) {
        return {
          error: true,
          status: 404,
          message: `User with ID ${postId} not found`,
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          error: true,
          status: response.status,
          message: "You don't have permission to view this user",
        };
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("User data loaded:", data);
      return data;
    } catch (error) {
      console.error("Error fetching user:", error);
      return {
        error: true,
        status: 500,
        message: "Failed to load user data. Please try again.",
      };
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = useLoaderData({ from: "/_auth/_isAdmin/admin/users/$postId" });

  if (data.error) {
    return (
      <div className="error-container">
        <h2>Error {data.status}</h2>
        <p>{data.message}</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="user-detail">
      <h1>User Details</h1>
      {data.data ? (
        <div className="user-info">
          <div className="user-field">
            <strong>ID:</strong> {data.data.id}
          </div>
          <div className="user-field">
            <strong>Email:</strong> {data.data.email}
          </div>
          <div className="user-field">
            <strong>Role:</strong>{" "}
            {data.data.is_super_user ? "Administrator" : "Regular User"}
          </div>
          {/* Add more user fields as needed */}
        </div>
      ) : (
        <div className="loading">Loading user data...</div>
      )}

      <h2>Raw Data</h2>
      <pre className="json-data">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
