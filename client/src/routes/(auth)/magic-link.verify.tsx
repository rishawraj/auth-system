import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import NavBar from "../../components/NavBar-test";
import { setToken, setType } from "../../utils/authToken";

const magicLinkSearchSchema = z.object({
  token: z.string().optional().default(""),
  email: z.string().optional().default(""),
});

export const Route = createFileRoute("/(auth)/magic-link/verify")({
  component: MagicLinkVerifyComponent,
  validateSearch: magicLinkSearchSchema,
});

const customEase = [0.23, 1, 0.32, 1];

function MagicLinkVerifyComponent() {
  const search = useSearch({ from: "/(auth)/magic-link/verify" });
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const { token, email } = search;

  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >(token && email ? "idle" : "error");
  const [errorMessage, setErrorMessage] = useState(
    token && email
      ? ""
      : "Invalid or missing link parameters. Please request a new magic link.",
  );

  const handleVerify = async () => {
    if (!token || !email) {
      setStatus("error");
      setErrorMessage("Missing magic link token or email address.");
      return;
    }

    setStatus("verifying");
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/magic-link/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          data?.error || data?.message || "Invalid or expired magic link.",
        );
        return;
      }

      setStatus("success");
      toast.success("Successfully authenticated with Magic Link!");

      if (data.isTwoFactorEnabled) {
        navigate({
          to: "/2FALogin",
          search: { token: data.accessToken, type: "magic_link" },
        });
      } else {
        setToken(data.accessToken);
        setType("magic_link");
        setTimeout(() => {
          navigate({ to: "/profile" });
        }, 800);
      }
    } catch (err) {
      console.error("Magic link verification failed:", err);
      setStatus("error");
      setErrorMessage(
        "Unable to connect to the authentication server. Please try again.",
      );
    }
  };

  return (
    <>
      <NavBar />
      <div className="bg-background flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: customEase }}
          className="bg-secondary/40 border-primary/10 w-full max-w-md rounded-2xl border p-8 text-center shadow-xl backdrop-blur-sm"
        >
          {status === "idle" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
                  <Sparkles className="h-8 w-8" />
                </div>
              </div>

              <div>
                <h2 className="text-text font-fraunces text-2xl font-bold">
                  Sign in with Magic Link
                </h2>
                <p className="text-text/70 mt-2 text-sm">
                  You are confirming sign-in for{" "}
                  <span className="text-text font-semibold">{email}</span>.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleVerify}
                  className="btn-press bg-primary text-primary-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4" />
                  Verify & Sign In
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/login" })}
                  className="btn-press border-primary/20 text-text hover:bg-secondary flex w-full cursor-pointer justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status === "verifying" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              </div>
              <div>
                <h2 className="text-text font-fraunces text-2xl font-bold">
                  Verifying Magic Link
                </h2>
                <p className="text-text/60 mt-2 text-sm">
                  Authenticating {email ? `for ${email}` : "your session"}...
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: customEase }}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h2 className="text-text font-fraunces text-2xl font-bold">
                  Authentication Successful!
                </h2>
                <p className="text-text/60 mt-2 text-sm">
                  Redirecting to your dashboard...
                </p>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: customEase }}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <XCircle className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h2 className="text-text font-fraunces text-2xl font-bold">
                  Sign-in Failed
                </h2>
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {token && email && (
                  <button
                    type="button"
                    onClick={handleVerify}
                    className="btn-press bg-primary text-primary-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90"
                  >
                    <Sparkles className="h-4 w-4" />
                    Try Again
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate({ to: "/login" })}
                  className="btn-press border-primary/20 text-text hover:bg-secondary flex w-full cursor-pointer justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}
