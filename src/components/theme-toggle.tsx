"use client";

import { useState, useEffect } from "react";

type ThemeMode = "system" | "light" | "dark";

const OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "system", label: "System", icon: "\uD83D\uDCBB" },
  { value: "light", label: "Light", icon: "\u2600\uFE0F" },
  { value: "dark", label: "Dark", icon: "\uD83C\uDF19" },
];

function applyTheme(mode: ThemeMode) {
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  // Read stored preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    const initial = stored === "light" || stored === "dark" ? stored : "system";
    setMode(initial);
    applyTheme(initial);
  }, []);

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      if (mode === "system") {
        applyTheme("system");
      }
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [mode]);

  function selectMode(newMode: ThemeMode) {
    setMode(newMode);
    applyTheme(newMode);
    if (newMode === "system") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", newMode);
    }
  }

  return (
    <div className="px-2 py-1.5">
      <p className="mb-1.5 text-xs text-muted-foreground">Appearance</p>
      <div className="flex gap-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              selectMode(opt.value);
            }}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === opt.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
