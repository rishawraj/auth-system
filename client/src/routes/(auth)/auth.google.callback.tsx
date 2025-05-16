import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { z } from "zod";

import { setToken, setType } from "../../utils/authToken";

const authTokenSchema = z.object({
  token: z.string().optional().default(""),
});

export const Route = createFileRoute("/(auth)/auth/google/callback")({
  component: RouteComponent,
  validateSearch: authTokenSchema, // ValAidate the search parameters using zod
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/auth/google/callback" });
  const search = useSearch({ from: "/(auth)/auth/google/callback" });
  const token = search.token;
  console.log("Token from search params:", token);
  // Here you can handle the token, e.g., store it in cookies or local storage
  if (token) {
    // Cookies.set("token", token, { expires: 7 });
    setToken(token);
    setType("google");
    navigate({ to: "/profile" });
  }

  if (!token) {
    console.error("Token is missing in the search parameters");
    return <div>Error: Token is missing in the search parameters</div>;
  }

  return <div>Hello "/auth/google/callback"!</div>;
}
