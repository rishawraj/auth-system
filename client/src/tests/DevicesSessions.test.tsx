import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";

import { DevicesSessions } from "../components/DevicesSessions";
import * as api from "../utils/api";

describe("DevicesSessions Component", () => {
  const sampleSessions = [
    {
      id: "sess_1",
      jti: "jti_1",
      ip_address: "192.168.1.50",
      user_agent: "Mozilla/5.0 Chrome/120.0.0.0",
      browser: "Chrome",
      os: "macOS",
      device: "Desktop",
      issued_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      is_current: true,
    },
    {
      id: "sess_2",
      jti: "jti_2",
      ip_address: "192.168.1.51",
      user_agent: "Mozilla/5.0 Mobile/15E148 Safari/604.1",
      browser: "Safari",
      os: "iOS",
      device: "iPhone",
      issued_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      is_current: false,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("fetches and renders active sessions list with device badges", async () => {
    vi.spyOn(api, "fetchWithAuth").mockResolvedValue({
      sessions: sampleSessions,
    });

    render(<DevicesSessions />);

    expect(
      await screen.findByText(/devices & active sessions/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Chrome")).toBeInTheDocument();
    expect(screen.getByText("on macOS")).toBeInTheDocument();
    expect(screen.getByText("Safari")).toBeInTheDocument();
    expect(screen.getByText("on iOS")).toBeInTheDocument();
    expect(screen.getByText(/this device/i)).toBeInTheDocument();
  });

  test("revokes remote session and refreshes session list", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(api, "fetchWithAuth");

    // First call returns 2 sessions
    fetchSpy.mockResolvedValueOnce({
      sessions: sampleSessions,
    });

    render(<DevicesSessions />);

    expect(await screen.findByText("Safari")).toBeInTheDocument();

    // Mock revoke call response
    fetchSpy.mockResolvedValueOnce({
      message: "Session revoked successfully",
    });

    // Mock subsequent sessions list call with only 1 session
    fetchSpy.mockResolvedValueOnce({
      sessions: [sampleSessions[0]],
    });

    // Find and click revoke button for remote device (exact name "Revoke")
    const remoteRevokeBtn = screen.getByRole("button", { name: /^revoke$/i });
    await user.click(remoteRevokeBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/sessions/revoke",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ jti: "jti_2" }),
        }),
      );
    });
  });

  test("revokes all other devices when confirming bulk revocation modal", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(api, "fetchWithAuth");

    fetchSpy.mockResolvedValueOnce({
      sessions: sampleSessions,
    });

    render(<DevicesSessions />);

    expect(
      await screen.findByRole("button", {
        name: /sign out all other devices/i,
      }),
    ).toBeInTheDocument();

    fetchSpy.mockResolvedValueOnce({
      message: "All other sessions revoked successfully",
    });
    fetchSpy.mockResolvedValueOnce({
      sessions: [sampleSessions[0]],
    });

    const revokeOthersBtn = screen.getByRole("button", {
      name: /sign out all other devices/i,
    });
    await user.click(revokeOthersBtn);

    // Confirm in modal
    const confirmBtn = await screen.findByRole("button", {
      name: /yes, sign out all/i,
    });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/sessions/revoke-others", {
        method: "POST",
      });
    });
  });
});
