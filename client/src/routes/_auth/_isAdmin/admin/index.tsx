import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AdminDashboardUsers from "../../../../components/AdminDashboardUsers";
import AdminLogs from "../../../../components/AdminLogs";
import NavBar from "../../../../components/NavBar-test";
import { RecentActivity } from "../../../../components/RecentActivity";
import { StatCard } from "../../../../components/StatCard";
import {
  recentActivityQuery,
  statsQuery,
  adminDashboardPaginatedUsersQuery,
  adminLogsQuery,
} from "../../../../queries/dashboard";
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

  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(recentActivityQuery),
      context.queryClient.ensureQueryData(statsQuery),
      context.queryClient.ensureInfiniteQueryData(adminLogsQuery),
    ]);
  },

  component: RouteComponent,
  errorComponent: () => <div>Something went wrong</div>,
});

function RouteComponent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const stats = useQuery(statsQuery);
  const recentActivity = useQuery(recentActivityQuery);
  // const adminLogs = useQuery(adminLogsQuery);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(adminLogsQuery);

  const allAdminLogs = data?.pages.flatMap((page) => page.data.logs) || [];

  console.log({ data, allAdminLogs, hasNextPage });

  const adminDashboardUsers = useQuery(
    adminDashboardPaginatedUsersQuery(page, debouncedSearch),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <>
      <NavBar />
      <div className="space-y-6 p-6 pt-24">
        <AdminLogs
          data={allAdminLogs}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />

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

        <div className="flex-col justify-center">
          <AdminDashboardUsers
            users={adminDashboardUsers?.data?.data?.users || []}
            currentPage={page}
            // callback function for search (input change)
            onSearchChange={setSearch}
          />

          <div className="flex justify-center gap-4 bg-amber-600">
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

        {/* <AdminLogs data={adminLogs.data.data.rows} /> */}
        {/* Activity */}
        <RecentActivity data={recentActivity.data.data} />
      </div>
    </>
  );
}
