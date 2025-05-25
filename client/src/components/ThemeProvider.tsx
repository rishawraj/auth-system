import { useEffect, useState } from "react";

import { Theme, ThemeContext } from "../context/themeContext";
import { getItem, setItem } from "../utils/localStorage";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "auth-system-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    getItem(storageKey) || defaultTheme,
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      setItem(storageKey, systemTheme);
    } else {
      root.classList.add(theme);
      setItem(storageKey, theme);
    }
  }, [theme, storageKey]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
