import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ToastContainer } from "react-toastify";

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
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme === "system" ? "dark" : theme}
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
