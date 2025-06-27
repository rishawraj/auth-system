import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import NavBar from "../../components/NavBar-test";
import { fetchWithAuth } from "../../utils/api";

export const Route = createFileRoute("/_auth/2FAEnable")({
  component: TwoFactorPage,
});

type MeResponse = {
  id: string;
  email: string;
  name: string;
  profilePicture: string;
  is_super_user: boolean;
  is_two_factor_enabled: boolean;
};

function TwoFactorPage() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTwoFactorStatus = async () => {
      try {
        const data = await fetchWithAuth<MeResponse>("/me");

        setIs2FAEnabled(data.is_two_factor_enabled);
        setLoading(false);
      } catch (error) {
        console.error("Error checking 2FA status:", error);
        setLoading(false);
      }
    };

    checkTwoFactorStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <>
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Two-Factor Authentication (2FA)
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>
                {is2FAEnabled
                  ? "Two-factor authentication is currently enabled."
                  : "Add an extra layer of security to your account by enabling two-factor authentication."}
              </p>
            </div>
            <div className="mt-5">
              {is2FAEnabled ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${"bg-red-600 hover:bg-red-700"}`}
                >
                  <Link to="/2FADisable">Disable 2FA</Link>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${"bg-indigo-600 hover:bg-indigo-700"}`}
                >
                  <Link to="/2FA">Enable 2FA</Link>
                </motion.button>
              )}

              <Link className="bg-accent mx-3 rounded-md p-2" to="/profile">
                Later
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
// ? "bg-red-600 hover:bg-red-700"
