import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";

import UserLoginForm from "../components/UserLoginForm";
import * as authToken from "../utils/authToken";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

describe("UserLoginForm Component", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("renders login form with email, password inputs, submit button, and navigation links", () => {
    render(<UserLoginForm />);

    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /forgot your password\?/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up now/i }),
    ).toBeInTheDocument();
  });

  test("validates email input and prevents submission when invalid", async () => {
    const user = userEvent.setup();
    const { container } = render(<UserLoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, "not-an-email");
    await user.type(passwordInput, "ValidPassword123!");

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  test("submits form successfully and navigates to /profile when 2FA is disabled", async () => {
    const user = userEvent.setup();
    const setTokenSpy = vi.spyOn(authToken, "setToken");
    const setTypeSpy = vi.spyOn(authToken, "setType");

    const mockResponse = {
      message: "Login successful",
      accessToken: "mock_jwt_access_token",
      isTwoFactorEnabled: false,
      type: "email",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    render(<UserLoginForm />);

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(setTokenSpy).toHaveBeenCalledWith("mock_jwt_access_token");
      expect(setTypeSpy).toHaveBeenCalledWith("email");
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/profile" });
    });
  });

  test("navigates to /2FALogin challenge when user has 2FA enabled", async () => {
    const user = userEvent.setup();

    const mockResponse = {
      message: "Login successful",
      accessToken: "mock_temp_2fa_jwt",
      isTwoFactorEnabled: true,
      type: "email",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    render(<UserLoginForm />);

    await user.type(screen.getByLabelText(/email/i), "bob@example.com");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/2FALogin",
        search: { token: "mock_temp_2fa_jwt", type: "email" },
      });
    });
  });

  test("displays error message when server responds with 401 unauthorized", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid credentials" }),
    } as Response);

    render(<UserLoginForm />);

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "WrongPassword!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });

  test("navigates to /forgot-password when clicking forgot password button", async () => {
    const user = userEvent.setup();
    render(<UserLoginForm />);

    await user.click(
      screen.getByRole("button", { name: /forgot your password\?/i }),
    );
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/forgot-password" });
  });

  test("navigates to /register when clicking sign up button", async () => {
    const user = userEvent.setup();
    render(<UserLoginForm />);

    await user.click(screen.getByRole("button", { name: /sign up now/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/register" });
  });
});
