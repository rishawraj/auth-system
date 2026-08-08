import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import React, { useState, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";

import { setToken, setType } from "../../utils/authToken";

export const Route = createFileRoute("/(auth)/verify")({
  component: VerifyComponent,
});

function VerifyComponent() {
  const navigate = useNavigate({ from: "/verify" });
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const search = useSearch({ from: "/(auth)/verify" }) as {
    pending_email?: string;
    QRCodeImageUrl?: string;
  }; // Let useSearch infer the correct type

  const pending_email = search?.pending_email;

  const [verificationCode, setVerificationCode] = useState<string[]>(
    Array(6).fill(""),
  );
  const [showResend, setShowresend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // const inputRefs = Array(6)
  //   .fill(0)
  //   .map(() => React.createRef<HTMLInputElement>());

  // Stable refs — created once, not on every render
  const inputRefs = React.useRef<React.RefObject<HTMLInputElement | null>[]>(
    Array(6)
      .fill(0)
      .map(() => React.createRef<HTMLInputElement>()),
  ).current;

  const startCountdown = useCallback(() => {
    setCountdown(60);
    setCanResend(false);
  }, []);

  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

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

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    if (isNaN(Number(value))) return;

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

    // reset error
    if (error) setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "") // strip non-digits
      .slice(0, 6 - index); // only take as many digits as remaining boxes

    if (!pasted) return;

    console.log({ pasted }); // 123456

    const newCode = [...verificationCode];
    let lastFilledIndex = index;
    console.log({ newCode });

    for (let i = 0; i < pasted.length; i++) {
      newCode[index + i] = pasted[i];
      lastFilledIndex = index + i;
      console.log({ i, newCode, lastFilledIndex });
    }
    // reset error
    if (error) setError(null);

    console.log({ newCode });

    setVerificationCode(newCode); // but this is ["","","6","","",""]
    // when i paste into the last box a new empty box appears

    // focus the next empty box, or last filled one if all filled
    const nextIndex = Math.min(lastFilledIndex + 1, 5);
    inputRefs[nextIndex].current?.focus();
  };

  const handleResend = async () => {
    console.log("spidermanaaaa");
    if (!pending_email) {
      navigate({ to: "/register" });
      return;
    }

    setResending(true);
    setResendMessage(null);

    try {
      const response = await fetch(`${API_URL}/resend-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: pending_email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ?? `Server error: ${response.status}`,
        );
      }

      setResendMessage("A new code has been sent to your email");
      startCountdown();
    } catch (error) {
      console.error("Erorr resending code:", error);
      setResendMessage(
        error instanceof Error
          ? error.message
          : "Failed to resend code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    const code = verificationCode.join("");
    try {
      const response = await fetch(`${API_URL}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ pending_email, code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ?? `Server error: ${response.status}`,
        );
      }

      const responseData = await response.json();

      const token = responseData.accessToken;
      setToken(token);
      setType("email");

      navigate({
        to: "/2FAEnable",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "verification failed. Please try again.";

      console.error("Error during verification:", error);
      setError(message);
      setVerificationCode(Array(6).fill(""));
      inputRefs[0].current?.focus();

      if (message.toLowerCase().includes("expired")) {
        setShowresend(true);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="flex flex-col items-center rounded-lg border bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Verify your email
        </h1>
        <p className="mb-6 text-center text-gray-600">
          Please enter the 6-digit code sent to your email
        </p>

        <div className="mb-6 flex gap-2">
          {verificationCode.map((digit, index) => (
            <input
              key={`verify-input-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              ref={inputRefs[index]}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              className={`h-12 w-12 rounded-md border text-center text-xl font-bold focus:outline-none ${
                error
                  ? "border-red-500 focus:border-red-500"
                  : "focus:border-blue-500"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-center text-sm text-red-500">{error}</p>
        )}

        {!showResend && (
          <div className="mb-4 flex flex-col items-center gap-2">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm font-medium text-blue-500 underline hover:text-blue-600 disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Resend code in {countdown}s
              </p>
            )}
            {resendMessage && (
              <p className="text-center text-sm text-gray-600">
                {resendMessage}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        >
          Verify
        </button>
      </div>
    </div>
  );
}
