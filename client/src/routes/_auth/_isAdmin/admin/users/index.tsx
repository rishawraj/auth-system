import {
  useLoaderData,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";

import AdminUsersTable from "../../../../../components/admin/AdminUsersTable";
import NavBar from "../../../../../components/NavBar-test";
import { User } from "../../../../../types/types";
import { fetchWithAuth } from "../../../../../utils/api";
import { getToken } from "../../../../../utils/authToken";

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export const Route = createFileRoute("/_auth/_isAdmin/admin/users/")({
  beforeLoad: async () => {
    const token = getToken();
    console.log({ token });
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },

  loader: async () => {
    const token = getToken();
    // const API_URL = import.meta.env.VITE_API_BASE_URL;
    console.log({ token });
    if (!token) {
      throw new Error("Authentication token not found.");
    }
    const response = await fetchWithAuth<ApiResponse<User[]>>(`/admin/users`);
    console.log({ response });
    return response;
  },
  component: RouteComponent,
  errorComponent: () => <div>Something went wrong</div>,
});

function RouteComponent() {
  const loaderData = useLoaderData({ from: "/_auth/_isAdmin/admin/users/" });
  const users = loaderData.data;

  return (
    <div className="flex flex-col gap-5">
      <NavBar />
      <div className="mx-auto max-w-5xl">
        <AdminUsersTable users={users} />
      </div>
    </div>
  );
}
