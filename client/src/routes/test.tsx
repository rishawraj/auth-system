import { createFileRoute, useLoaderData } from "@tanstack/react-router";

export const Route = createFileRoute("/test")({
  loader: async () => {
    const res = await fetch("http://localhost:3000/test-refresh-token", {
      credentials: "include",
    });
    console.log(res);
    return res.json();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = useLoaderData({ from: "/test" });

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
