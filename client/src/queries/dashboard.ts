// for /admin/index.tsx

import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { fetchWithAuth } from "../utils/api";

interface AdminLogsPage {
  data: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export const statsQuery = queryOptions({
  queryKey: ["stats"],
  queryFn: () => fetchWithAuth("/admin/stats/overview"),
});

export const recentActivityQuery = queryOptions({
  queryKey: ["recent-activity"],
  queryFn: () => fetchWithAuth("/admin/recent-activity"),
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
      return fetchWithAuth(`/admin/paginated-users?${params}`);
    },
    placeholderData: (previousData) => previousData,
  });
