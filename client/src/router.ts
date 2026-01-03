import { createRouter } from "@tanstack/react-router";

import { queryClient } from "./queryClient";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

// REQUIRED for type inference
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
