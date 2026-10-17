/**
 * Theme plumbing shared by the root layout (no-flash script) and <ThemeToggle>.
 *
 * With no stored choice the site follows the OS (prefers-color-scheme). A manual
 * choice sets data-theme="light" | "dark" on <html> and is saved in localStorage.
 * scripts/shots.mjs mirrors THEME_STORAGE_KEY; keep the two in sync.
 */
export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Runs synchronously in <head> before first paint, so a stored choice is applied
 * before any content is drawn. Plain ES5 with no dependencies; storage can throw
 * (private mode, blocked site data), so it is wrapped in try/catch.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
