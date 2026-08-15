import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";

import { useTheme } from "../hooks/useTheme";
import { ThemeProvider } from "../Providers/ThemeProvider";

interface RouterContext {
  queryClient: QueryClient;
}

const RootLayout = () => {
  const { theme } = useTheme();

  return (
    <>
      <div className="bg-background text-text min-h-screen">
        {/* <Navbar /> */}
        <Outlet />
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme={theme === "system" ? "system" : theme}
        />
      </div>
      <TanStackRouterDevtools />
    </>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <ThemeProvider defaultTheme="dark">
      <RootLayout />
    </ThemeProvider>
  ),
});
