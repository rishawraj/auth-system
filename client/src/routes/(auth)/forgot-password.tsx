import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/(auth)/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError("");
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      console.log({ res });

      const data = await res.json();
      console.log({ data });

      if (!res.ok) {
        setError(data.error);
      } else {
        console.log({ res });
        setMessage(data.message);
      }
    } catch (err) {
      setError("Something went wrong");
      console.log(err);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl mb-4">Forgot Password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          type="submit"
        >
          Send Reset Email
        </button>
      </form>

      {message && <p className="text-green-600 mt-4">{message}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
