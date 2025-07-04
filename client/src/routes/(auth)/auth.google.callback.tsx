import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { z } from "zod";

import { setToken, setType } from "../../utils/authToken";

const authTokenSchema = z.object({
  token: z.string().optional().default(""),
  isTwoFactorEnabled: z.boolean().optional().default(false),
});

export const Route = createFileRoute("/(auth)/auth/google/callback")({
  component: RouteComponent,
  validateSearch: authTokenSchema, // ValAidate the search parameters using zod
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/auth/google/callback" });
  const search = useSearch({ from: "/(auth)/auth/google/callback" });
  const { token, isTwoFactorEnabled } = search;

  console.log("Token from search params:", token);
  console.log("2FA enabled:", isTwoFactorEnabled);
  // Here you can handle the token, e.g., store it in cookies or local storage
  if (token) {
    if (isTwoFactorEnabled) {
      navigate({ to: "/2FALogin", search: { token: token, type: "google" } });
    } else {
      setToken(token);
      setType("google");
      navigate({ to: "/profile" });
    }
  }

  if (!token) {
    console.error("Token is missing in the search parameters");
    return <div>Error: Token is missing in the search parameters</div>;
  }

  return <div>Hello "/auth/google/callback"!</div>;
}
