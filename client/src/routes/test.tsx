import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/test")({
  loader: async () => {
    try {
      // First set the cookie

      // Give a small delay (optional, but can help ensure cookie is set)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Then try to access it - removed problematic Cache-Control header
      const res = await fetch("http://localhost:3000/test-cookie", {
        method: "GET",
        credentials: "include",
        // Removed Cache-Control header that caused CORS issues
      });

      console.log("Test cookie response:", res);

      // Optional: dump cookies from document.cookie
      console.log("Document cookies:", document.cookie);
    } catch (error) {
      console.error("Error in cookie test:", error);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/test"!</div>;
}
