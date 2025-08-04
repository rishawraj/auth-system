import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import React, { useState, ChangeEvent, KeyboardEvent } from "react";

import { setToken, setType } from "../../utils/authToken";

export const Route = createFileRoute("/(auth)/verify")({
  component: VerifyComponent,
});

function VerifyComponent() {
  const navigate = useNavigate({ from: "/verify" });
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const search = useSearch({ from: "/(auth)/verify" }) as {
    token?: string;
    QRCodeImageUrl?: string;
  }; // Let useSearch infer the correct type

  const token = search?.token as string; // token from /verify?token=...
  console.log(token);

  const [verificationCode, setVerificationCode] = useState<string[]>(
    Array(6).fill(""),
  );
  const inputRefs = Array(6)
    .fill(0)
    .map(() => React.createRef<HTMLInputElement>());

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    if (isNaN(Number(value))) return;

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

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

  const handleSubmit = async () => {
    const code = verificationCode.join("");
    try {
      const response = await fetch(`${API_URL}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token, code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ?? `Server error: ${response.status}`,
        );
      }

      const responseData = await response.json();
      console.log("Verification response:", responseData);
      console.log(responseData.refreshToken);

      // todo

      setToken(token);
      setType("email");

      navigate({
        to: "/2FAEnable",
      });
    } catch (error) {
      console.error("Error during verification:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Verify your email
        </h1>
        <p className="mb-6 text-center text-gray-600">
          Please enter the 6-digit code sent to your email
        </p>

        <div className="mb-6 flex gap-2">
          {verificationCode.map((digit, index) => (
            <input
              key={`verify-input-${index + Math.random()}`}
              type="text"
              maxLength={1}
              value={digit}
              ref={inputRefs[index]}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-12 w-12 rounded-md border text-center text-xl font-bold focus:border-blue-500 focus:outline-none"
            />
          ))}
        </div>

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
