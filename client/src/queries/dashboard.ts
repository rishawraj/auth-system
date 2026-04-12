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

export const adminDashboardUsersQuery = queryOptions({
  queryKey: ["admin-dashboard-users"],
  queryFn: () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const token = getToken();
    const response = fetch(`${API_URL}/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());
    console.log(" from admindahboard uesrs");
    return response;
  },
});
