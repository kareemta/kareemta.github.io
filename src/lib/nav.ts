export type NavItem = { href: string; label: string };

/** Site sections, in the order they appear in the nav (also used by the sitemap and 404 page). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/work/", label: "Work" },
  { href: "/books/", label: "Books" },
  { href: "/movies/", label: "Movies" },
  { href: "/tv/", label: "TV" },
  { href: "/travel/", label: "Travel" },
  { href: "/contact/", label: "Contact" },
];

/** Strip the trailing slash (trailingSlash: true) so "/work/" and "/work" compare equal. */
export function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * aria-current for a link: "page" on an exact match, "true" when the visitor is
 * deeper inside that section (e.g. a sub-page under /work). The home link
 * only ever matches exactly.
 */
export function ariaCurrentFor(pathname: string, href: string): "page" | "true" | undefined {
  const here = normalizePath(pathname);
  const target = normalizePath(href);
  if (here === target) return "page";
  if (target !== "/" && here.startsWith(`${target}/`)) return "true";
  return undefined;
}
