import { createFileRoute } from "@tanstack/react-router";

import { Hero } from "../components/home/Hero";
import { HowItWorks } from "../components/home/HowItWorks";
import NavBar from "../components/NavBar-test";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <Hero />
      <HowItWorks />
    </div>
  );
}
