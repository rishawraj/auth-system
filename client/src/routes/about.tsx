import { createFileRoute } from "@tanstack/react-router";

import { AboutPage } from "../components/about/AboutPage";
import NavBar from "../components/NavBar-test";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div>
      <NavBar />
      <AboutPage />
    </div>
  );
}
