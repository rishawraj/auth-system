import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";

import BackupCodesModal from "../../components/ShowBackUpCodes-new";
import { fetchWithAuth } from "../../utils/api";
import { getToken } from "../../utils/authToken";

interface TwoFactorData {
  id: string;
  is_two_factor_enabled: boolean;
  qrcodeImageUrl: string;
  secret: string;
}

interface LoaderResult {
  success: boolean;
  data?: TwoFactorData;
  error?: string;
}

interface VerifyResponse {
  error: string;
  rawCodes: string[];
  message: string;
}

export const Route = createFileRoute("/_auth/2FA")({
  loader: async (): Promise<LoaderResult> => {
    try {
      const data = await fetch("http://localhost:3000/2fa/enable", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      if (!data.ok) {
        throw new Error("Failed to fetch 2FA setup data");
      }
      const response = await data.json();
      console.log({ response });
      return { success: true, data: response as TwoFactorData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to setup 2FA",
      };
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  // const loaderData = Route.useLoaderData();
  const loaderData = useLoaderData({ from: "/_auth/2FA" });

  // console.log(loaderData);

  const result = useMemo<LoaderResult>(
    () =>
      loaderData ?? { success: false, error: "Failed to load 2FA setup data" },
    [loaderData],
  );

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!result.success || !result.data) return;

      setError("");
      setLoading(true);

      try {
        const response = (await fetchWithAuth("/2fa/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            id: result.data.id,
          }),
        })) as VerifyResponse;

        console.log({ response });
        const backupCodes = response.rawCodes;
        setBackupCodes(backupCodes);
        setShowBackupCodes(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify code");
      } finally {
        setLoading(false);
      }
    },
    [code, result],
  );

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, []);

  if (!result.success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Failed to Setup 2FA
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {result.error}
          </p>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate({ to: "/profile" })}
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Return to Profile
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Set up Two-Factor Authentication
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Scan the QR code or manually enter the secret key
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex justify-center">
              <img
                src={result.data?.qrcodeImageUrl}
                alt="2FA QR Code"
                className="h-64 w-64 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              />
            </div>

            <div className="rounded-md bg-white p-4 shadow-sm dark:bg-gray-800">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Manual Entry
              </h3>
              <div className="mt-2 flex items-center space-x-2">
                <code className="block rounded bg-gray-100 px-3 py-2 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {result.data?.secret}
                </code>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    result.data?.secret && copyToClipboard(result.data.secret)
                  }
                  className="inline-flex items-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Copy
                </motion.button>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                If you can't scan the QR code, manually enter this secret key in
                your authenticator app.
              </p>
            </div>

            <div className="rounded-md bg-white p-4 shadow-sm dark:bg-gray-800">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Instructions:
              </h3>
              <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  Download an authenticator app if you haven't already (Google
                  Authenticator, Authy, etc.)
                </li>
                <li>
                  Open your authenticator app and either:
                  <ul className="mt-1 list-disc pl-4">
                    <li>Scan the QR code above, or</li>
                    <li>Manually enter the secret key provided</li>
                  </ul>
                </li>
                <li>
                  Enter the 6-digit code shown in your authenticator app below
                </li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="code" className="sr-only">
                  Authentication Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  maxLength={6}
                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  {loading ? (
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                    />
                  ) : (
                    "Verify and Enable 2FA"
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* create popup for 2fa backupcodes */}

      {showBackupCodes && <BackupCodesModal backupCodes={backupCodes} />}
    </>
  );
}
