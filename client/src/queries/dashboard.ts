// for /admin/index.tsx

import type {
  AdminLogsPage,
  AdminPaginatedUsersResponse,
  AdminStatsResponse,
  RecentActivityResponse,
} from "@auth-system/shared";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { fetchWithAuth } from "../utils/api";

export type {
  AdminLogsPage,
  AdminStatsResponse,
  RecentActivityResponse,
  AdminPaginatedUsersResponse,
};

export const statsQuery = queryOptions({
  queryKey: ["stats"],
  queryFn: async (): Promise<AdminStatsResponse> =>
    fetchWithAuth("/admin/stats/overview"),
});

export const recentActivityQuery = queryOptions({
  queryKey: ["recent-activity"],
  queryFn: () =>
    fetchWithAuth<RecentActivityResponse>("/admin/recent-activity"),
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
