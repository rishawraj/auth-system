import { createFileRoute } from "@tanstack/react-router";

import { FeaturesPage } from "../components/features/FeaturesPage";
import NavBar from "../components/NavBar-test";

export const Route = createFileRoute("/features")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <NavBar />
      <FeaturesPage />
    </div>
  );
}
