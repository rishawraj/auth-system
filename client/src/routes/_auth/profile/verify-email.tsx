import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";

import { verifyEmail } from "../../../queries/adminDashboardUsers";
import { setToken } from "../../../utils/authToken";

export const Route = createFileRoute("/_auth/profile/verify-email")({
  component: RouteComponent,
});

function RouteComponent() {
  const naviate = useNavigate();

  const [code, setCode] = useState("");

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      console.log("verified", data);
      setToken(data.accessToken);
      alert("email updated");
      naviate({ to: "/profile" });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

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
      </div>
    </div>
  );
}
