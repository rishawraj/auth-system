import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, test, expect, beforeEach, vi } from "vitest";

import { useTheme } from "../hooks/useTheme";
import { ThemeProvider } from "../Providers/ThemeProvider";

describe("useTheme and ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    vi.restoreAllMocks();
  });

  test("throws error when useTheme is called outside of ThemeProvider", () => {
    // Suppress React error boundary console log for this test
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used within a ThemeProvider",
    );

    consoleError.mockRestore();
  });

  test("initializes with defaultTheme and applies class to document.documentElement", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("updates theme and document.documentElement class when setTheme is called", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  test("respects system preference when theme is 'system'", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("dark"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    window.matchMedia = originalMatchMedia;
  });
});
