import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

import NavBar from "../components/NavBar-test";

export const Route = createFileRoute("/test")({
  component: ThemeShowcase,
});

export default function ThemeShowcase() {
  const [isDark, setIsDark] = useState(false);

  // Toggle the .dark class on the <html> tag for testing purposes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    // bg-background and text-text set the foundation for the whole page
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <div className="bg-background text-text p-6 transition-colors duration-300 md:p-12">
        <div className="mx-auto max-w-4xl space-y-10">
          {/* Header */}
          <header className="border-secondary flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-primary text-4xl font-bold">Theme System</h1>
              <p className="mt-1 opacity-80">
                Testing the custom OKLCH color palette.
              </p>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="bg-secondary flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold shadow-sm transition-all hover:brightness-110"
            >
              {isDark ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
            </button>
          </header>

          {/* Color Palette Swatches */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Color Palette</h2>
            <div className="flex flex-wrap gap-6">
              {[
                {
                  name: "Background",
                  bgClass: "bg-background",
                  borderClass: "border-secondary",
                },
                { name: "Text", bgClass: "bg-text", borderClass: "" },
                { name: "Primary", bgClass: "bg-primary", borderClass: "" },
                { name: "Secondary", bgClass: "bg-secondary", borderClass: "" },
                { name: "Accent", bgClass: "bg-accent", borderClass: "" },
              ].map((color) => (
                <div
                  key={color.name}
                  className="flex flex-col items-center gap-3"
                >
                  <div
                    className={`h-20 w-20 rounded-2xl shadow-md ${color.bgClass} ${color.borderClass ? `border-2 ${color.borderClass}` : ""}`}
                  ></div>
                  <span className="text-sm font-medium">{color.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Components Showcase */}
          <section className="grid grid-cols-1 gap-8 pt-4 md:grid-cols-2">
            {/* Card 1: Secondary Background & Primary Button */}
            <div className="bg-secondary border-secondary flex flex-col gap-5 rounded-3xl border p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Standard Card</h3>
                {/* Using accent for badges */}
                <span className="bg-accent text-background rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase shadow-sm">
                  New
                </span>
              </div>
              <p className="leading-relaxed opacity-80">
                This card uses the <strong>secondary</strong> color for its
                background. It creates a soft contrast against the main
                background, perfect for grouping content.
              </p>
              <div className="mt-auto flex gap-3 pt-4">
                {/* Primary action */}
                <button className="bg-primary text-background flex-1 rounded-xl py-3 font-semibold shadow-sm transition-all hover:brightness-110">
                  Primary Action
                </button>
              </div>
            </div>

            {/* Card 2: Main Background & Accent Elements */}
            <div className="border-secondary bg-background flex flex-col gap-5 rounded-3xl border-2 p-8 shadow-sm">
              <h3 className="text-accent text-2xl font-bold">
                Interactive Card
              </h3>
              <p className="opacity-80">
                Testing how inputs and secondary buttons look using the theme
                variables.
              </p>

              <div className="mt-2 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Email Address
                  </label>
                  {/* Inputs using background, secondary borders, and primary focus rings */}
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="bg-background border-secondary text-text placeholder-text/40 focus:ring-primary w-full rounded-xl border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  {/* Accent action */}
                  <button className="bg-accent text-background flex-1 rounded-xl py-3 font-semibold shadow-sm transition-all hover:brightness-110">
                    Submit
                  </button>
                  {/* Outline/Ghost action */}
                  <button className="border-secondary hover:bg-secondary flex-1 rounded-xl border-2 py-3 font-semibold transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
