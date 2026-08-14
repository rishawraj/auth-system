import { describe, test, expect, beforeEach, vi } from "vitest";

import { getItem, setItem, removeItem } from "../utils/localStorage";

describe("localStorage helper tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("getItem returns null when key does not exist", () => {
    expect(getItem("non_existent_key")).toBeNull();
  });

  test("setItem stores serialized JSON and getItem parses it", () => {
    const data = { theme: "dark", user: { id: 123, name: "Alice" } };
    setItem("app_config", data);

    const retrieved = getItem<typeof data>("app_config");
    expect(retrieved).toEqual(data);
  });

  test("setItem handles primitive values (strings, numbers, booleans)", () => {
    setItem("count", 42);
    expect(getItem<number>("count")).toBe(42);

    setItem("isActive", true);
    expect(getItem<boolean>("isActive")).toBe(true);

    setItem("label", "hello");
    expect(getItem<string>("label")).toBe("hello");
  });

  test("removeItem deletes item from localStorage", () => {
    setItem("temp_key", "temp_value");
    expect(getItem("temp_key")).toBe("temp_value");

    removeItem("temp_key");
    expect(getItem("temp_key")).toBeNull();
  });

  test("setItem handles storage errors gracefully", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => setItem("key", "value")).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });
});
