import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { verifyEmail } from "../../../queries/adminDashboardUsers";
import { fetchWithAuth } from "../../../utils/api";
import { setToken } from "../../../utils/authToken";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/profile/verify-email")({
  component: RouteComponent,
});

function RouteComponent() {
  const naviate = useNavigate();

  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const startCountdown = useCallback(() => {
    setCountdown(60);
    setCanResend(false);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      console.log("verified", data);
      setToken(data.accessToken);
      toast.success("Email updated successfully");
      naviate({ to: "/profile" });
    },
    onError: (error) => {
      console.error(error.message);
      toast.error(
        error instanceof Error ? error.message : "Failed to verify email",
      );
    },
  });

  const handleResend = async () => {
    setResending(true);
    setResendMessage(null);
    setResendError(null);

    try {
      const data = await fetchWithAuth<{ message: string }>(
        "/resend-verify-email-code",
        { method: "POST" },
      );
      setResendMessage(data.message);
      startCountdown();
    } catch (error) {
      setResendError(
        error instanceof Error
          ? error.message
          : "Failed to resend code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    verifyMutation.mutate(code);
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm dark:bg-gray-900">
        <h1 className="mb-2 text-2xl font-bold">Verify your email</h1>

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Enter the verification code sent to your email address.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="code"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Verification Code
            </label>

            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {verifyMutation.isError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {verifyMutation.error.message}
            </p>
          )}

          {verifyMutation.isSuccess && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
              Email verified successfully!
            </p>
          )}

          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="w-full rounded-lg bg-purple-600 px-4 py-3 font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-medium text-purple-600 underline hover:text-purple-700 disabled:opacity-50 dark:text-purple-400 dark:hover:text-purple-300"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Resend code in {countdown}s
            </p>
          )}

          {resendMessage && (
            <p className="text-center text-sm text-green-600 dark:text-green-400">
              {resendMessage}
            </p>
          )}
          {resendError && (
            <p className="text-center text-sm text-red-600 dark:text-red-400">
              {resendError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
