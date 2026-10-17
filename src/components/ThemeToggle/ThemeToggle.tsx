"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, isTheme, type Theme } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme actually showing: the manual choice on <html>, else the OS setting. */
function getEffectiveTheme(): Theme {
  const chosen = document.documentElement.getAttribute("data-theme");
  if (isTheme(chosen)) return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Re-render when the OS setting or the data-theme attribute changes (e.g. another toggle). */
function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    media.removeEventListener("change", onChange);
    observer.disconnect();
  };
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
  const theme = useSyncExternalStore(subscribe, getEffectiveTheme, getServerTheme);
  const isDark = theme === "dark";

  function toggle() {
    const next: Theme = getEffectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode, blocked site data): the choice lasts for this page only.
    }
  }

  return (
    <button type="button" className={styles.toggle} aria-pressed={isDark} onClick={toggle}>
      <span className={styles.label}>Dark mode</span>
      <span className={styles.state} aria-hidden="true">
        {theme === null ? "" : isDark ? "on" : "off"}
      </span>
    </button>
  );
}
