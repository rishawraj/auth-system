import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import BackupCodesModal from "../../components/ShowBackUpCodes-new";
import { fetchWithAuth } from "../../utils/api";
import { getType } from "../../utils/authToken";

export const Route = createFileRoute("/_auth/regenerate2FAcodes")({
  component: RouteComponent,
});

function EmailAuth2FARegenerate() {
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const navigate = useNavigate();

  const handleRegenerateConfirm = async () => {
    try {
      setError("");
      setLoading(true);

      const data = await fetchWithAuth<{ rawCodes: string[] }>(
        "/2fa/regenerate-backup-codes-email",
        {
          method: "POST",
          body: JSON.stringify({
            password,
            totp,
          }),
        },
      );

      console.log(data);

      setBackupCodes(data.rawCodes);
      setShowConfirmation(false);
      setShowBackupCodes(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  if (showBackupCodes) {
    return (
      <BackupCodesModal
        backupCodes={backupCodes}
        onClose={() => navigate({ to: "/profile" })}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Regenerate Backup Codes
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Generate new backup codes for two-factor authentication
          </p>
        </div>

        {!showConfirmation ? (
          <div className="space-y-6">
            <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle
                    className="h-5 w-5 text-yellow-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <ul className="list-disc space-y-1 pl-5">
                      <li>
                        Generating new backup codes will invalidate all existing
                        codes
                      </li>
                      <li>
                        Make sure you have access to your authenticator app
                        before proceeding
                      </li>
                      <li>
                        Store the new codes in a secure location immediately
                        after generation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowConfirmation(true)}
                className="flex w-full justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 sm:w-auto"
              >
                Continue
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate({ to: "/profile" })}
                className="flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:w-auto dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle
                    className="h-5 w-5 text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Final Confirmation
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    This action cannot be undone. All existing backup codes will
                    stop working immediately.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="totp"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                TOTP
              </label>
              <div className="mt-1">
                <input
                  id="totp"
                  name="totp"
                  type="totp"
                  required
                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleRegenerateConfirm}
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 sm:w-auto"
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
                  "Regenerate Backup Codes"
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:opacity-50 sm:w-auto dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
              >
                Go Back
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleAuth2FARegenerate() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setError("");
    try {
      await fetchWithAuth("/2fa/disable-2fa-send-otp", {
        method: "POST",
      });
      setOtpSent(true);
    } catch (err) {
      setError("Failed to send OTP.");
    }
  };

  const handleRegenerateConfirm = async () => {
    try {
      setError("");
      setLoading(true);

      const data = await fetchWithAuth<{ codes: string[] }>(
        "/2fa/regenerate-backup-codes-google",
        {
          method: "POST",
          body: JSON.stringify({
            code: otp,
          }),
        },
      );

      setBackupCodes(data.codes);
      setShowConfirmation(false);
      setShowBackupCodes(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  if (showBackupCodes) {
    return (
      <BackupCodesModal
        backupCodes={backupCodes}
        onClose={() => navigate({ to: "/profile" })}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Regenerate Backup Codes
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Generate new backup codes for two-factor authentication
          </p>
        </div>

        {!showConfirmation ? (
          <div className="space-y-6">
            <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle
                    className="h-5 w-5 text-yellow-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <ul className="list-disc space-y-1 pl-5">
                      <li>
                        Generating new backup codes will invalidate all existing
                        codes
                      </li>
                      <li>
                        Make sure you have access to your authenticator app
                        before proceeding
                      </li>
                      <li>
                        Store the new codes in a secure location immediately
                        after generation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowConfirmation(true)}
                className="flex w-full justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 sm:w-auto"
              >
                Continue
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate({ to: "/profile" })}
                className="flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:w-auto dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle
                    className="h-5 w-5 text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Final Confirmation
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    This action cannot be undone. All existing backup codes will
                    stop working immediately.
                  </div>
                </div>
              </div>
            </div>

            {!otpSent ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSendOtp}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                Send OTP
              </motion.button>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => navigate({ to: "/profile" })}
                    className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleRegenerateConfirm}
                    disabled={loading || otp.length !== 6}
                    className="flex-1 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-400"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="mx-auto h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                      />
                    ) : (
                      "Regenerate Backup Codes"
                    )}
                  </motion.button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RouteComponent() {
  const authType = getType();

  return authType === "google" ? (
    <GoogleAuth2FARegenerate />
  ) : (
    <EmailAuth2FARegenerate />
  );
}
