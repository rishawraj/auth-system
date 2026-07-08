import { createFileRoute } from "@tanstack/react-router";
import NavBar from "../components/NavBar-test";
import { FeaturesPage } from "../components/features/FeaturesPage";

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
