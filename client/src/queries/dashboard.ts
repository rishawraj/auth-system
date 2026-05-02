// for /admin/index.tsx

import { queryOptions } from "@tanstack/react-query";

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
