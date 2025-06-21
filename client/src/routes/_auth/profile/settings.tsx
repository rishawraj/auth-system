import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";

import NavBar from "../../../components/NavBar-test";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { fetchWithAuth } from "../../../utils/api";

interface Settings {
  emailNotifications: boolean;
  loginAlerts: boolean;
  twoFactorAuth: boolean;
  publicProfile: boolean;
}

export const Route = createFileRoute("/_auth/profile/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    loginAlerts: true,
    twoFactorAuth: false,
    publicProfile: false,
  });

  const handleToggle = (setting: keyof Settings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await fetchWithAuth("/profile/settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });

      setMessage("Settings updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update settings",
      );
    } finally {
      setLoading(false);
    }
  };

  const settingsGroups = [
    {
      title: "Notifications",
      description: "Manage how you receive notifications",
      settings: [
        {
          key: "emailNotifications" as keyof Settings,
          label: "Email Notifications",
          description: "Receive email notifications for important updates",
        },
        {
          key: "loginAlerts" as keyof Settings,
          label: "Login Alerts",
          description: "Get notified when there's a new login to your account",
        },
      ],
    },
    {
      title: "Security",
      description: "Manage your account's security settings",
      settings: [
        {
          key: "twoFactorAuth" as keyof Settings,
          label: "Two-Factor Authentication",
          description: "Add an extra layer of security to your account",
        },
      ],
    },
    {
      title: "Privacy",
      description: "Control your profile's visibility",
      settings: [
        {
          key: "publicProfile" as keyof Settings,
          label: "Public Profile",
          description: "Make your profile visible to other users",
        },
      ],
    },
  ];

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
            <div className="px-4 py-5 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="border-b border-gray-200 pb-5 dark:border-gray-700"
              >
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Settings
                </h3>
                <p className="mt-2 max-w-4xl text-sm text-gray-500 dark:text-gray-400">
                  Manage your account settings and preferences
                </p>
              </motion.div>

              <div className="mt-6 space-y-8">
                {settingsGroups.map((group, groupIndex) => (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + groupIndex * 0.1 }}
                  >
                    <div className="mb-4">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        {group.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {group.description}
                      </p>
                    </div>
                    <div className="space-y-4">
                      {group.settings.map((setting) => (
                        <motion.div
                          key={setting.key}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50"
                        >
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                              {setting.label}
                            </h5>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {setting.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggle(setting.key)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${
                              settings[setting.key]
                                ? "bg-indigo-600 dark:bg-indigo-500"
                                : "bg-gray-200 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                settings[setting.key]
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="border-t border-gray-200 pt-6 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Theme
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Choose your preferred theme
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>
                </motion.div>

                {(error || message) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-md p-4 ${
                      error
                        ? "bg-red-50 dark:bg-red-900/50"
                        : "bg-green-50 dark:bg-green-900/50"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        error
                          ? "text-red-800 dark:text-red-200"
                          : "text-green-800 dark:text-green-200"
                      }`}
                    >
                      {error || message}
                    </p>
                  </motion.div>
                )}

                <div className="flex items-center justify-end gap-4 pt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate({ to: "/profile" })}
                    className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                      />
                    ) : (
                      "Save Changes"
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
