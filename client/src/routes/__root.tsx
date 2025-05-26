import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ToastContainer } from "react-toastify";

import { Navbar } from "../components/Navbar";
import { useTheme } from "../hooks/useTheme";
import { ThemeProvider } from "../Providers/ThemeProvider";

const RootLayout = () => {
  const { theme } = useTheme();

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-gray-900 dark:text-white">
        <Navbar />
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
