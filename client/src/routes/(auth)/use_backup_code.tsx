import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { z } from "zod";
import { setToken, setType } from "../../utils/authToken";

const authLoginSchema = z.object({
  token: z.string().optional().default(""),
  type: z.string().optional().default(""),
});

export const Route = createFileRoute("/(auth)/use_backup_code")({
  component: RouteComponent,
  validateSearch: authLoginSchema,
});

function RouteComponent() {
  const search = useSearch({ from: "/(auth)/use_backup_code" });
  const { token, type } = search;
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !backupCode) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/2fa/validate-backup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: backupCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid backup code");
      }

      const data = await response.json();
      console.log(data);

      // Set the token and navigate to profile
      setToken(token);
      setType(type);
      navigate({ to: "/profile" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to verify backup code",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Use Backup Code
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter one of your backup codes to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="backupCode" className="sr-only">
              Backup Code
            </label>
            <input
              id="backupCode"
              name="backupCode"
              type="text"
              required
              maxLength={9}
              className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Enter backup code (XXXX-XXXX)"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              pattern="[A-Z0-9]{4}-[A-Z0-9]{4}"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading || backupCode.length !== 9}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                />
              ) : (
                "Verify Backup Code"
              )}
            </motion.button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() =>
                navigate({ to: "/2FALogin", search: { token, type } })
              }
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Back to 2FA Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
