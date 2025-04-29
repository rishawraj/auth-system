import { useState } from "react";
import { z } from "zod";
import Cookies from "js-cookie";
import { useNavigate } from "@tanstack/react-router";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
};

interface FormData {
  name: string;
  email: string;
  password: string;
}

const formSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Email is invalid"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});
const handleGoogleLogin = async () => {
  // setIsLoading(true);
  // Redirect to the backend Google auth endpoint
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
};

export default function UserLoginForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate({ from: "/login" });

  const validateForm = (): boolean => {
    const result = formSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: FormErrors = {};

      for (const issue of result.error.issues) {
        const fieldName = issue.path[0] as keyof FormErrors;
        fieldErrors[fieldName] = issue.message;
      }

      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Server error: ${response.status}`
        );
      }
      // set the cookie with token

      const data = await response.json();
      const token = data.token;

      if (!token) {
        throw new Error("Token not received from server");
      }

      Cookies.set("token", token, { expires: 7 });

      setSuccess(true);
      setFormData({ name: "", email: "", password: "" });
      navigate({ to: "/profile" });
    } catch (error) {
      console.error("Login error:", error);
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        setErrorMessage(
          "Unable to connect to the server. Please check if the server is running at http://localhost:3000"
        );
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      setErrorMessage("");
      setLoading(true);

      await fetch("http://localhost:3000/health", {
        method: "GET",
        signal: controller.signal,
      });

      setErrorMessage("✅ Server connection successful!");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setErrorMessage("⏱️ Request timed out. Please try again.");
      } else {
        setErrorMessage(
          "❌ Failed to connect to server. Please make sure it's running."
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Log in to your Account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <div className="space-y-6">
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Log In successful!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.email ? "border-red-300" : "border-gray-300"}`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.password ? "border-red-300" : "border-gray-300"}`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {errorMessage && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Logging you in...
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={testConnection}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? "Checking..." : "Test Server Connection"}
            </button>
            {errorMessage && (
              <p className="mt-2 text-sm text-center text-red-600">
                {errorMessage}
              </p>
            )}
          </div>
          <div className="my-2 p-1">
            <p>
              forgot password{" "}
              <button
                onClick={() => navigate({ to: "/forgot-password" })}
                className="text-blue-400 font-bold cursor-pointer"
              >
                click here
              </button>
              .
            </p>
          </div>
          <hr />
          <div>
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => navigate({ to: "/register" })}
                className="text-blue-400 font-bold cursor-pointer"
              >
                Register
              </button>
            </p>
            <hr />
            {/* login with google */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
