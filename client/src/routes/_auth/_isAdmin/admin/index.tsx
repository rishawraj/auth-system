import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { getUserFromToken } from "../../../../utils/authToken";
import NavBar from "../../../../components/NavBar-test";

export const Route = createFileRoute("/_auth/_isAdmin/admin/")({
  beforeLoad: async () => {
    const user = getUserFromToken();
    console.log("User from token:", user);

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (!user.is_super_user) {
      console.log("User is not super user");

      toast.error("You are not authorized to access this page.");
      throw redirect({ to: "/login" });
    }
  },

  component: RouteComponent,
  errorComponent: () => <div>Something went wrong</div>,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <div>
      <NavBar />

      <div className="bg-accent container mx-auto px-4 py-24">
        <h1>Admin</h1>
        <p>This is the admin page.</p>

        <button
          className="m-2 cursor-pointer rounded-md bg-green-400 p-2"
          onClick={() => navigate({ to: "/admin/users" })}
        >
          manage users
        </button>
        <div>hello</div>
      </div>
    </div>
  );
}
