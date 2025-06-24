import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { motion } from "framer-motion";

import { LogoutButton } from "../../../components/LogoutButton";
import NavBar from "../../../components/NavBar-test";
import type { User } from "../../../types/auth";
import { fetchWithAuth } from "../../../utils/api";

export const Route = createFileRoute("/_auth/profile/")({
  loader: async () => {
    type ProfileResponse = {
      user: User;
    };

    try {
      const data = await fetchWithAuth<ProfileResponse>("/profile");
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  },
  pendingComponent: LoadingSpinner,
  pendingMs: 500,
  pendingMinMs: 300,
  component: RouteComponent,
});

function RouteComponent() {
  const profile = useLoaderData({ from: "/_auth/profile/" });
  const navigate = useNavigate();
  const img_url = (profile && profile.user.profile_pic) || "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2"
              >
                <img
                  src={img_url}
                  alt="Profile"
                  className="h-32 w-32 rounded-full border-4 border-white bg-white object-cover dark:border-gray-800"
                />
              </motion.div>
            </div>

            <div className="px-4 pt-20 pb-6 text-center sm:px-6">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                {profile?.user.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-1 text-sm text-gray-500 dark:text-gray-400"
              >
                {profile?.user.email}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex flex-wrap justify-center gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate({ to: "/profile/edit" })}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Edit Profile
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate({ to: "/profile/settings" })}
                  className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                >
                  Settings
                </motion.button>
                <div className="w-full sm:w-auto">
                  <LogoutButton />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <div className="py-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Account Details
                  </h3>
                  <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Account Status
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {profile?.user.is_active ? "Active" : "Inactive"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Member Since
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {profile?.user.registration_date
                          ? new Date(
                              profile.user.registration_date,
                            ).toLocaleDateString()
                          : "Unknown"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Last Login
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {profile?.user.last_login
                          ? new Date(
                              profile.user.last_login,
                            ).toLocaleDateString()
                          : "Never"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Account Type
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {profile?.user.is_super_user
                          ? "Administrator"
                          : "Standard User"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-gray-700 dark:border-t-indigo-400"
      />
    </div>
  );
}
