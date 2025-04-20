import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/protected")({
  component: RouteComponent,
  beforeLoad: () => {
    console.log("checking for auth");
  },
});

function RouteComponent() {
  return <div>Hello "/protected"!</div>;
}
