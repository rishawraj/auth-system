import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { toast } from "react-toastify";

import NavBar from "../../../../components/NavBar-test";
import { recentActivityQuery, statsQuery } from "../../../../queries/dashboard";
import { queryClient } from "../../../../queryClient";
import { getUserFromToken } from "../../../../utils/authToken";

export const Route = createFileRoute("/_auth/_isAdmin/admin/")({
  beforeLoad: async () => {
    const user = getUserFromToken();
    console.log("User from token:", user);

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (!user.is_super_user) {
      console.log("User is not super user");

      toast.error("You are not authorized to access this page.");
      throw redirect({ to: "/login" });
    }
  },

  // temporary
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(recentActivityQuery),
      queryClient.ensureQueryData(statsQuery),
    ]);
  },

  // ! make this work!
  // loader: async ({ context }) => {
  //   await Promise.all([
  //     context.queryClient.ensureQueryData(recentActivityQuery),
  //     context.queryClient.ensureQueryData(statsQuery),
  //   ]);
  // },

  component: RouteComponent,
  errorComponent: () => <div>Something went wrong</div>,
});

function RouteComponent() {
  const navigate = useNavigate();
  // const { response } = useLoaderData({ from: "/_auth/_isAdmin/admin/" });
  const stats = useQuery(statsQuery);
  const recentActivity = useQuery(recentActivityQuery);
  return (
    <div>
      <NavBar />

      <div className="bg-accent container mx-auto px-4 py-24">
        <h1>Admin</h1>
        <p>This is the admin page.</p>

        <button
          className="m-2 cursor-pointer rounded-md bg-green-400 p-2"
          onClick={() => navigate({ to: "/admin/users" })}
        >
          manage users
        </button>
        <div>hello</div>
        <pre>{`${JSON.stringify(stats.data, null, 2)}`}</pre>
        <pre>{`${JSON.stringify(recentActivity.data, null, 2)}`}</pre>
      </div>
    </div>
  );
}
