import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ToastContainer } from "react-toastify";

import { useTheme } from "../hooks/useTheme";
import { ThemeProvider } from "../Providers/ThemeProvider";

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

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark">
      <RootLayout />
    </ThemeProvider>
  ),
});
