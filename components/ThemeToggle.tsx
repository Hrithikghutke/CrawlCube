"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-[84px] h-[28px] rounded-full bg-neutral-200 dark:bg-neutral-800" />
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-border">
      <button
        onClick={() => setTheme("light")}
        className={`p-1 rounded-full transition-colors ${
          theme === "light"
            ? "bg-background text-black shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`p-1 rounded-full transition-colors ${
          theme === "dark"
            ? "bg-secondary text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
