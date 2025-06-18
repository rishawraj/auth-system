import { createFileRoute } from "@tanstack/react-router";

import NavBar from "../components/NavBar-test";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="h-full">
      <NavBar />
    </div>
  );
}
