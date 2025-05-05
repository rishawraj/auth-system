import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import React, { useState, ChangeEvent, KeyboardEvent } from "react";
import { setToken } from "../../utils/authToken";

export const Route = createFileRoute("/(auth)/verify")({
  component: VerifyComponent,
});

function VerifyComponent() {
  const navigate = useNavigate({ from: "/verify" });
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const search = useSearch({ from: "/(auth)/verify" }) as { token?: string }; // Let useSearch infer the correct type

  console.log(search);

  const token = search?.token as string; // token from /verify?token=...
  console.log(token);

  const [verificationCode, setVerificationCode] = useState<string[]>(
    Array(6).fill("")
  );
  const inputRefs = Array(6)
    .fill(0)
    .map(() => React.createRef<HTMLInputElement>());

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
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
    event: KeyboardEvent<HTMLInputElement>
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
          errorData?.message || `Server error: ${response.status}`
        );
      }

      const responseData = await response.json();
      console.log(responseData);
      setToken(token);
      navigate({ to: "/profile" });
    } catch (error) {
      console.error("Error during verification:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Verify your email
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Please enter the 6-digit code sent to your email
        </p>

        <div className="flex gap-2 mb-6">
          {verificationCode.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              ref={inputRefs[index]}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-bold border rounded-md focus:outline-none focus:border-blue-500"
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Verify
        </button>
      </div>
    </div>
  );
}
