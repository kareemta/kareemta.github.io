/**
 * Client-only helpers for code that can't use CSS variables directly (canvas,
 * WebGL): know when the theme changes and read token values.
 */

/** Calls onChange when the OS color scheme or the manual data-theme choice changes. */
export function subscribeTheme(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    media.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

/** Current value of a CSS custom property on <html>, trimmed. */
export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
