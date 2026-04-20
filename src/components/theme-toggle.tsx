"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = stored === "dark" || (!stored && prefersDark);
    setDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  function toggle() {
    const newDark = !dark;
    setDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm"
    >
      <span>{dark ? "Light mode" : "Dark mode"}</span>
      <span>{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}