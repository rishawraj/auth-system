import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, vi } from "vitest";

import BackupCodesModal from "../components/ShowBackUpCodes-new";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

describe("BackupCodesModal Component", () => {
  const sampleCodes = [
    "A1B2-C3D4",
    "E5F6-G7H8",
    "I9J0-K1L2",
    "M3N4-O5P6",
    "Q7R8-S9T0",
  ];

  beforeEach(() => {
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  test("renders nothing if backupCodes array is empty", () => {
    const { container } = render(<BackupCodesModal backupCodes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders modal with backup codes header and reveal button", () => {
    render(<BackupCodesModal backupCodes={sampleCodes} />);

    expect(screen.getByText(/backup recovery codes/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reveal.*backup codes/i }),
    ).toBeInTheDocument();
  });

  test("toggles visibility and reveals backup codes and copy buttons on click", async () => {
    const user = userEvent.setup();
    render(<BackupCodesModal backupCodes={sampleCodes} />);

    const revealButton = screen.getByRole("button", {
      name: /reveal.*backup codes/i,
    });
    await user.click(revealButton);

    expect(screen.getByText("A1B2-C3D4")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy all codes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download as file/i }),
    ).toBeInTheDocument();
  });

  test("copies all codes to clipboard when clicking copy all codes", async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      configurable: true,
      value: {
        writeText: writeTextSpy,
      },
    });

    render(<BackupCodesModal backupCodes={sampleCodes} />);

    // 1. Reveal codes first
    const revealButton = screen.getByRole("button", {
      name: /reveal.*backup codes/i,
    });
    await user.click(revealButton);

    // 2. Click copy all codes
    const copyAllButton = screen.getByRole("button", {
      name: /copy all codes/i,
    });
    await user.click(copyAllButton);

    expect(writeTextSpy).toHaveBeenCalledWith(sampleCodes.join("\n"));
  });

  test("navigates to /profile when clicking confirmation button", async () => {
    const user = userEvent.setup();

    render(<BackupCodesModal backupCodes={sampleCodes} />);

    const confirmButton = screen.getByRole("button", {
      name: /i've saved my codes/i,
    });
    await user.click(confirmButton);

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/profile" });
  });
});
