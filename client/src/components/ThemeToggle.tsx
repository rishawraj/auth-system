import { Moon, Sun } from "lucide-react";

import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "dark":
        return <Sun className="h-4 w-4" />;
      case "light":
        return <Moon className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Dark Mode";
      case "dark":
        return "Light Mode";
      default:
        return "Light Mode";
    }
  };

  const getNextTheme = () => {
    if (theme === "light") return "dark";
    if (theme === "dark") return "system";
    return "light";
  };

  return (
    <button
      className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground inline-flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors"
      onClick={toggleTheme}
      title={`Switch to ${getNextTheme()} mode`}
    >
      {getIcon()}
      <span className="text-sm">{getLabel()}</span>
    </button>
  );
}
