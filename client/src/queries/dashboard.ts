// for /admin/index.tsx

import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { getToken } from "../utils/authToken";

export const statsQuery = queryOptions({
  queryKey: ["stats"],
  queryFn: () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const token = getToken();
    const response = fetch(`${API_URL}/admin/stats/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());

    return response;
  },
});

export const recentActivityQuery = queryOptions({
  queryKey: ["recent-activity"],
  queryFn: () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const token = getToken();
    const response = fetch(`${API_URL}/admin/recent-activity`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());
    return response;
  },
});

export const adminLogsQuery = infiniteQueryOptions({
  queryKey: ["admin-logs"],
  initialPageParam: null as string | null,
  queryFn: ({ pageParam }) => {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const token = getToken();

    // construct URL
    const url = new URL(`${API_URL}/admin/admin-audit-logs`);
    url.searchParams.set("limit", "10");
    if (pageParam) {
      url.searchParams.set("cursor", pageParam);
    }

    const response = fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());

    return response;
  },
  getNextPageParam: (lastPage) => {
    console.log("last page response: ", lastPage);
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
      const API_URL = import.meta.env.VITE_API_BASE_URL;
      const token = getToken();
      const response = fetch(
        `${API_URL}/admin/paginated-users?page=${page}&limit=10&search=${encodeURIComponent(search)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      ).then((res) => res.json());
      return response;
    },
    placeholderData: (previousData) => previousData,
  });
