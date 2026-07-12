// for /admin/index.tsx

import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { AdminLogItem } from "../types/dashboard";
import { User } from "../types/types";
import { fetchWithAuth } from "../utils/api";

export interface AdminLogsPage {
  data: {
    logs: AdminLogItem[];
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface AdminOverviewStats {
  totalUsers: number;
  successfulLogins: number;
  failedLogins: number;
}

export interface AdminStatsResponse {
  status: string;
  message: string;
  data: AdminOverviewStats;
}

export const statsQuery = queryOptions({
  queryKey: ["stats"],
  queryFn: async (): Promise<AdminStatsResponse> =>
    fetchWithAuth("/admin/stats/overview"),
});

interface RecentActivity {
  success: boolean;
  email: string;
  time: string;
}

interface recentActivityResponse {
  status: string;
  message: string;
  data: RecentActivity[];
}

export const recentActivityQuery = queryOptions({
  queryKey: ["recent-activity"],
  queryFn: () =>
    fetchWithAuth<recentActivityResponse>("/admin/recent-activity"),
});

export const adminLogsQuery = infiniteQueryOptions({
  queryKey: ["admin-logs"],
  initialPageParam: null as string | null,
  queryFn: ({ pageParam }) => {
    const params = new URLSearchParams({
      limit: "10",
    });

    if (pageParam) {
      params.set("cursor", pageParam);
    }

    return fetchWithAuth<AdminLogsPage>(`/admin/admin-audit-logs?${params}`);
  },

  getNextPageParam: (lastPage) => {
    return lastPage.data.hasMore ? lastPage.data.nextCursor : undefined;
  },
});

interface AdminUsersPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AdminPaginatedUsersResponse {
  status: string;
  message: string;
  data: {
    users: User[];
    pagination: AdminUsersPagination;
  };
}

export const adminDashboardPaginatedUsersQuery = (
  page: number,
  search: string,
) =>
  queryOptions({
    queryKey: ["admin-dashboard-users", page, search],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
      });
      return fetchWithAuth<AdminPaginatedUsersResponse>(
        `/admin/paginated-users?${params}`,
      );
    },
    placeholderData: (previousData) => previousData,
  });
