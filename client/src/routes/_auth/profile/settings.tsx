import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/profile/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/profile/settings"!</div>;
}
