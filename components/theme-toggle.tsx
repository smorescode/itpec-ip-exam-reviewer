"use client";

import { useEffect, useState } from "react";

type ThemePreference = "system" | "light" | "dark";
type ActiveTheme = Exclude<ThemePreference, "system">;

const storageKey = "theme-preference";

function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedPreference = window.localStorage.getItem(storageKey);
  return storedPreference === "light" || storedPreference === "dark" ? storedPreference : "system";
}

function resolveTheme(preference: ThemePreference): ActiveTheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(preference: ThemePreference) {
  const activeTheme = resolveTheme(preference);
  const root = document.documentElement;

  root.dataset.theme = activeTheme;
  root.style.colorScheme = activeTheme;
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);

  useEffect(() => {
    applyTheme(preference);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (window.localStorage.getItem(storageKey)) {
        return;
      }

      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [preference]);

  function cycleTheme() {
    const nextPreference: ThemePreference =
      preference === "system" ? "dark" : preference === "dark" ? "light" : "system";

    setPreference(nextPreference);

    if (nextPreference === "system") {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, nextPreference);
    }

    applyTheme(nextPreference);
  }

  const label =
    preference === "system" ? "System" : preference === "dark" ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="theme-toggle rounded-full px-3 py-2 text-sm font-medium"
      aria-label={`Theme: ${label}. Click to switch theme.`}
      title="Cycle theme: system, dark, light"
    >
      <span className="theme-toggle-indicator rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.18em]">
        {label}
      </span>
      <span>Theme</span>
    </button>
  );
}
