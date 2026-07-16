import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

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

const getDetailItems = (user: User) => [
  { label: "Account status", value: user.is_active ? "Active" : "Inactive" },
  {
    label: "Member since",
    value: user.registration_date
      ? new Date(user.registration_date).toLocaleDateString()
      : "Unknown",
  },
  {
    label: "Last login",
    value: user.last_login
      ? new Date(user.last_login).toLocaleDateString()
      : "Never",
  },
  {
    label: "Account type",
    value: user.is_super_user ? "Administrator" : "Standard user",
  },
];

function RouteComponent() {
  const profile = useLoaderData({ from: "/_auth/profile/" });
  const navigate = useNavigate();
  const user = profile?.user;

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-background min-h-screen">
      <NavBar />

      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          <div className="border-secondary overflow-hidden rounded-xl border">
            {/* Cover */}
            <div className="from-primary to-accent relative h-28 bg-linear-to-r">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
                className="absolute -bottom-14 left-1/2 -translate-x-1/2"
              >
                {user?.profile_pic ? (
                  <img
                    src={user.profile_pic}
                    alt={user.name}
                    sizes="112px"
                    className="border-background h-28 w-28 rounded-full border-4 object-cover"
                  />
                ) : (
                  <div className="border-background bg-secondary text-primary flex h-28 w-28 items-center justify-center rounded-full border-4 text-xl font-medium">
                    {initials}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Body */}
            <div className="px-4 pt-16 pb-8 text-center sm:px-8">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-text font-serif text-2xl"
              >
                {user?.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-text/60 mt-1 text-sm"
              >
                {user?.email}
              </motion.p>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-7 flex flex-wrap items-center justify-center gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate({ to: "/profile/edit" })}
                  className="bg-primary text-background hover:bg-accent hover:text-text focus-visible:ring-accent cursor-pointer rounded-full px-5 py-2 text-xs font-medium tracking-wide uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Edit profile
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate({ to: "/2FAEnable" })}
                  className="border-secondary text-text hover:border-primary hover:text-primary focus-visible:ring-accent cursor-pointer rounded-full border px-5 py-2 text-xs font-medium tracking-wide uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Enable 2FA
                </motion.button>

                {user?.is_super_user && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate({ to: "/admin" })}
                    className="border-accent text-accent hover:bg-accent hover:text-background focus-visible:ring-accent inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-5 py-2 text-xs font-medium tracking-wide uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <ShieldCheck size={13} />
                    Admin dashboard
                  </motion.button>
                )}

                <div className="w-full sm:w-auto">
                  <LogoutButton />
                </div>
              </motion.div>

              {/* Account details */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="border-secondary mt-10 border-t pt-8 text-left"
              >
                <h2 className="text-text/50 text-center text-[11px] font-medium tracking-[0.2em] uppercase">
                  Account details
                </h2>

                {user && (
                  <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {getDetailItems(user).map((item) => (
                      <div
                        key={item.label}
                        className="bg-secondary/30 rounded-lg p-4"
                      >
                        <dt className="text-text/50 text-xs font-medium">
                          {item.label}
                        </dt>
                        <dd className="text-text mt-1 text-sm">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
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
