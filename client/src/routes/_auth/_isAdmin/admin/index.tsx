import {
  useInfiniteQuery,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
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
import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { getUserFromToken } from "../../../../utils/authToken";

export const Route = createFileRoute("/_auth/_isAdmin/admin/")({
  beforeLoad: async () => {
    const user = getUserFromToken();
    // console.log("User from token:", user);

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

  const stats = useSuspenseQuery(statsQuery);
  const recentActivity = useQuery(recentActivityQuery);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(adminLogsQuery);
  const adminDashboardUsers = useQuery(
    adminDashboardPaginatedUsersQuery(page, debouncedSearch),
  );

  const allAdminLogs = data?.pages.flatMap((page) => page.data.logs) || [];

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
      {/* Apply global background and text colors here */}
      <div className="bg-background text-text min-h-screen space-y-8 p-6">
        {/* Page Header */}
        <header className="mb-8 flex flex-col gap-4 pt-16 sm:flex-row sm:items-center sm:justify-between sm:pt-20">
          <div>
            <h1 className="font-fraunces text-primary flex items-center gap-3 text-4xl font-bold">
              <LayoutDashboard className="text-accent h-9 w-9 shrink-0" />
              Dashboard Overview
            </h1>
            <p className="text-text/70 mt-1 text-sm sm:text-base">
              Manage system users, active sessions, and monitor security
              activity.
            </p>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

        {/* Bento Grid Layout for Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Column: Users Table */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <AdminDashboardUsers
              users={adminDashboardUsers?.data?.data?.users || []}
              currentPage={page}
              onSearchChange={setSearch}
            />

            {/* Pagination Controls with Icons */}
            <div className="bg-secondary/30 border-primary/10 mx-auto flex w-max items-center justify-center gap-4 rounded-full border px-6 py-2.5 shadow-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="bg-background text-primary hover:bg-primary hover:text-background inline-flex cursor-pointer items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-text text-xs font-bold tracking-wide">
                Page {page} of{" "}
                {adminDashboardUsers?.data?.data?.pagination?.totalPages || 1}
              </span>
              <button
                disabled={
                  page >=
                  (adminDashboardUsers?.data?.data?.pagination?.totalPages || 1)
                }
                onClick={() => setPage((prev) => prev + 1)}
                className="bg-background text-primary hover:bg-primary hover:text-background inline-flex cursor-pointer items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Side Column: Logs & Activity */}
          <div className="flex flex-col gap-6">
            <AdminLogs
              data={allAdminLogs}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
            <RecentActivity data={recentActivity?.data?.data} />
          </div>
        </div>
      </div>
    </>
  );
}

//   return (
//     <>
//       <NavBar />
//       <div className="space-y-6 p-6 pt-24">
//         <AdminLogs
//           data={allAdminLogs}
//           fetchNextPage={fetchNextPage}
//           hasNextPage={hasNextPage}
//           isFetchingNextPage={isFetchingNextPage}
//         />

//         <h1 className="text-2xl font-bold">Admin Dashboard</h1>

//         {/* Stats */}
//         <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//           <StatCard
//             label="Total Users"
//             value={stats.data.data.totalUsers}
//             color="blue"
//           />
//           <StatCard
//             label="Successful Logins"
//             value={stats.data.data.successfulLogins}
//             color="green"
//           />
//           <StatCard
//             label="Failed Logins"
//             value={stats.data.data.failedLogins}
//             color="red"
//           />
//         </div>

//         {/* users */}

//         <div className="flex-col justify-center">
//           <AdminDashboardUsers
//             users={adminDashboardUsers?.data?.data?.users || []}
//             currentPage={page}
//             // callback function for search (input change)
//             onSearchChange={setSearch}
//           />

//           <div className="flex justify-center gap-4 bg-amber-600">
//             <button
//               disabled={page === 1}
//               onClick={() => setPage((prev) => prev - 1)}
//             >
//               Previous
//             </button>

//             <span className="text-white">Page {page}</span>

//             <button
//               disabled={
//                 page >=
//                 (adminDashboardUsers?.data?.data?.pagination?.totalPages || 1)
//               }
//               onClick={() => setPage((prev) => prev + 1)}
//             >
//               Next
//             </button>
//           </div>
//         </div>

//         <RecentActivity data={recentActivity?.data?.data} />
//       </div>
//     </>
//   );
// }
