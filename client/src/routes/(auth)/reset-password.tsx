import {
  useNavigate,
  createFileRoute,
  useSearch,
} from "@tanstack/react-router";
import { useState } from "react";

// Define the expected shape and validation for your search parameters
const resetPasswordSearchSchema = z.object({
  token: z.string().optional().default(""), // Expect a token string, optional, defaults to empty string
});

export const Route = createFileRoute("/(auth)/reset-password")({
  component: RouteComponent,
  validateSearch: resetPasswordSearchSchema, // Validate the search parameters using zod
});

import { z } from "zod"; // Import a validation library like zod

function RouteComponent() {
  const search = useSearch({ from: "/(auth)/reset-password" }); // Use the search schema to validate the search parameters
  const token = search.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      setError("");

      // Validate password and confirmPassword
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      if (!token) {
        setError("Invalid token");
        return;
      }

      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setMessage(data.message);
      }

      // navigate to the login page after successful password reset
      if (res.ok) {
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 2000);
      }
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl mb-4">Reset Password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      {message && <p className="text-green-600 mt-4">{message}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
