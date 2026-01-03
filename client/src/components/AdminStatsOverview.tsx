import { getToken } from "../utils/authToken";

export const AdminStatsOverview = async () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const token = getToken();

  const response = await fetch(`${API_URL}/admin/stats/overview`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(response);

  return (
    <div>
      <h1>AdminStatsOverview</h1>
    </div>
  );
};
