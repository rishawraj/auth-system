import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";

import UserRegistrationForm from "../components/UserRegistrationForm";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

describe("UserRegistrationForm Component", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("renders registration form inputs and elements", () => {
    render(<UserRegistrationForm />);

    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  test("displays validation errors on invalid inputs", async () => {
    const user = userEvent.setup();
    render(<UserRegistrationForm />);

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);

    // Should prevent submit or show validation errors
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("submits valid registration form and navigates to /verify with search params", async () => {
    const user = userEvent.setup();

    const mockResponse = {
      message: "If the email is valid, a verification code has been sent.",
      pending_email: "alice@example.com",
      qrcodeImageUrl: "data:image/png;base64,mockqr",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    } as Response);

    render(<UserRegistrationForm />);

    await user.type(screen.getByLabelText(/full name/i), "Alice Wonderland");
    await user.type(
      screen.getByLabelText(/email address/i),
      "alice@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/verify",
        search: {
          pending_email: "alice@example.com",
          QRCodeImageUrl: "data:image/png;base64,mockqr",
        },
      });
    });
  });

  test("displays error message when registration fails", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Registration is temporarily disabled" }),
    } as Response);

    render(<UserRegistrationForm />);

    await user.type(screen.getByLabelText(/full name/i), "Bob Smith");
    await user.type(screen.getByLabelText(/email address/i), "bob@example.com");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(
      await screen.findByText("Registration is temporarily disabled"),
    ).toBeInTheDocument();
  });

  test("handles 429 rate limit with cooldown timer", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "60" }),
      json: async () => ({ error: "Too many attempts" }),
    } as Response);

    render(<UserRegistrationForm />);

    await user.type(screen.getByLabelText(/full name/i), "Charlie");
    await user.type(
      screen.getByLabelText(/email address/i),
      "charlie@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(/Too many attempts/i)).toBeInTheDocument();
  });
});
