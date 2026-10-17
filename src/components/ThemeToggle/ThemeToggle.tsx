"use client";

import { useSyncExternalStore } from "react";
import ToggleButton from "@/components/ToggleButton/ToggleButton";
import { THEME_STORAGE_KEY, isTheme, type Theme } from "@/lib/theme";
import { subscribeTheme } from "@/lib/themeWatch";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme actually showing: the manual choice on <html>, else the OS setting. */
function getEffectiveTheme(): Theme {
  const chosen = document.documentElement.getAttribute("data-theme");
  if (isTheme(chosen)) return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Unknown during the static build; the real value is read right after hydration. */
function getServerTheme(): Theme | null {
  return null;
}

/**
 * Switches between light and dark and remembers the choice in localStorage.
 * Without a stored choice the site follows the OS. Exposed to assistive tech as a
 * "Dark mode" toggle button (aria-pressed).
 */
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getEffectiveTheme, getServerTheme);
  const isDark = theme === null ? null : theme === "dark";

  function toggle() {
    const next: Theme = getEffectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode, blocked site data): the choice lasts for this page only.
    }
  }

  return <ToggleButton label="Dark mode" pressed={isDark} stateText={isDark ? "on" : "off"} onClick={toggle} />;
}
