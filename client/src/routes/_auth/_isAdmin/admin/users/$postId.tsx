import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import type { UserAuthData } from "../../../../../types/types";
import { fetchWithAuth } from "../../../../../utils/api";
import { getToken } from "../../../../../utils/authToken";

type ApiRespone<T> = {
  status: string;
  message: string;
  data: T;
};

export const Route = createFileRoute("/_auth/_isAdmin/admin/users/$postId")({
  loader: async ({ params }) => {
    const token = getToken();
    if (!token) {
      throw new Error("You must be logged in to view this page");
    }

    const postId = params.postId;
    console.log("Loading data for user ID:", postId);

    try {
      const data = await fetchWithAuth<ApiRespone<UserAuthData>>(
        `/admin/users/${postId}`,
      );
      console.log({ data });
      return data;
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = useLoaderData({ from: "/_auth/_isAdmin/admin/users/$postId" });

  // if (data.error) {
  //   return (
  //     <div className="error-container">
  //       <h2>Error {data.status}</h2>
  //       <p>{data.message}</p>
  //       <button onClick={() => window.history.back()}>Go Back</button>
  //     </div>
  //   );
  // }

  return (
    <div className="user-detail">
      <h1>User Details</h1>
      {data && data.data ? (
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
