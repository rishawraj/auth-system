import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import NavBar from "../../../components/NavBar-test";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { DevicesSessions } from "../../../components/DevicesSessions";

export const Route = createFileRoute("/_auth/profile/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md dark:border-gray-700/60 dark:bg-gray-800">
            <div className="px-6 py-6 sm:p-8">
              {/* Top Title & Navigation */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-5 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate({ to: "/profile" })}
                    className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    title="Back to Profile"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Devices & Sessions
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      View active logins, browser details, and manage session
                      revocation.
                    </p>
                  </div>
                </div>

                <ThemeToggle />
              </div>

              {/* Devices & Sessions Manager Component */}
              <div className="mt-8">
                <DevicesSessions />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
