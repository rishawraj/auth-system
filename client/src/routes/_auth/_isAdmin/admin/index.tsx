import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "react-toastify";

import AdminDashboardUsers from "../../../../components/AdminDashboardUsers";
import NavBar from "../../../../components/NavBar-test";
import { RecentActivity } from "../../../../components/RecentActivity";
import { StatCard } from "../../../../components/StatCard";
import {
  recentActivityQuery,
  statsQuery,
  adminDashboardPaginatedUsersQuery,
} from "../../../../queries/dashboard";
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
  // const navigate = useNavigate();
  // const { response } = useLoaderData({ from: "/_auth/_isAdmin/admin/" });

  const [page, setPage] = useState(1);
  const stats = useQuery(statsQuery);
  const recentActivity = useQuery(recentActivityQuery);
  const adminDashboardUsers = useQuery(adminDashboardPaginatedUsersQuery(page));
  // console.log("rope", recentActivity.data.data);
  return (
    <>
      <NavBar />
      <div className="space-y-6 p-6 pt-24">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Users"
            value={stats.data.data.totalUsers}
            color="blue"
          />
          <StatCard
            label="Successful Logins"
            value={stats.data.data.successfulLogins}
            color="green"
          />
          <StatCard
            label="Failed Logins"
            value={stats.data.data.failedLogins}
            color="red"
          />
        </div>

        {/* users */}

        <div>
          <AdminDashboardUsers
            users={adminDashboardUsers?.data?.data?.users || []}
          />

          <div className="flex gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </button>

            <span className="text-white">Page {page}</span>

            <button
              disabled={
                page >=
                (adminDashboardUsers?.data?.data?.pagination?.totalPages || 1)
              }
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {/* Activity */}
        <RecentActivity data={recentActivity.data.data} />
      </div>
    </>
  );
}
