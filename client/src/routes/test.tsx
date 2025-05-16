import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { getToken } from "../utils/authToken";

export const Route = createFileRoute("/test")({
  component: RouteComponent,
});

function RouteComponent() {
  const data = useLoaderData({ from: "/test" });

  return (
    <>
      <div>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>

      <button
        onClick={async () => {
          // include token from getToken
          const token = getToken();
          const res = await fetch("http://localhost:3000/test-refresh-token", {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log(res);
        }}
      >
        send
      </button>
    </>
  );
}
