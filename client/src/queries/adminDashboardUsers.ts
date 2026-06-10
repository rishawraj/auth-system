import { getToken } from "../utils/authToken";

export const toggleUserStatus = async ({
  id,
  is_active,
}: {
  id: string;
  is_active: boolean;
}) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const token = getToken();
  const response = await fetch(`${API_URL}/admin/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_active }),
  });
  if (!response.ok) throw new Error("failed to update user status");

  return response;
};

export const deleteUser = async ({ id }: { id: string }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const token = getToken();
  const response = await fetch(`${API_URL}/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("failed to update user status");

  return response;
};

// todo not from here
export const verifyEmail = async (code: string) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const token = getToken();
  console.log({ code, token });

  const response = await fetch(`${API_URL}/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  const data = await response.json();
  console.log({ data });

  if (!response.ok)
    throw new Error(data.error || data.message || "failed to update email");
  return data;
};
