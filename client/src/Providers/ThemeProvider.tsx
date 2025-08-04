import { useEffect, useState, useMemo } from "react";

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
}: Readonly<ThemeProviderProps>) {
  const [theme, setTheme] = useState<Theme>(() => {
    return getItem(storageKey) ?? defaultTheme;
  });

  // handle prop changes properly
  useEffect(() => {
    const storedTheme = getItem(storageKey);
    if (!storedTheme) {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    let effectiveTheme = theme;

    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    root.classList.add(effectiveTheme);
    setItem(storageKey, effectiveTheme);
  }, [theme, storageKey]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
