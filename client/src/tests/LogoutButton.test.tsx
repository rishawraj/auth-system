import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LogoutButton } from "../components/LogoutButton";

describe("LogoutButton", () => {
  beforeAll(() => {
    // Mock the useNavigate function from react-router
    vi.mock("@tanstack/react-router", () => ({
      useNavigate: () => vi.fn(),
    }));
  });
  it("renders logout button", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button")).toBeDefined();
  });
});
