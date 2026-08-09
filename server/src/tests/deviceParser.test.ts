import { describe, test, expect } from "vitest";
import { parseDevice } from "../utils/deviceParser.js";

describe("deviceParser Utility", () => {
  test("should parse Chrome on macOS user agent", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const result = parseDevice(ua);

    expect(result.browser).toContain("Chrome");
    expect(result.os).toContain("macOS");
    expect(result.device).toBeDefined();
  });

  test("should parse iPhone user agent as Mobile", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1";
    const result = parseDevice(ua);

    expect(result.browser).toContain("Safari");
    expect(result.os).toContain("iOS");
    expect(result.device).toContain("iPhone");
  });

  test("should return fallback default values when user agent is null or empty", () => {
    const resultNull = parseDevice(null);
    expect(resultNull).toEqual({
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Desktop",
    });

    const resultEmpty = parseDevice("");
    expect(resultEmpty).toEqual({
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Desktop",
    });
  });
});
