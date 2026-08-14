import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Cleanup after each test case (removes components from the DOM)
afterEach(() => {
  cleanup();
});

// Suppress JSDOM scrollTo not-implemented warnings
window.scrollTo = vi.fn();

// Robust matchMedia stub for framer-motion and theme switching in JSDOM
function setupMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

setupMatchMedia();

beforeEach(() => {
  setupMatchMedia();
});
