/**
 * Small display helpers and constants shared by server and client components.
 * Client-safe: never import runtime values from content.ts (it reads files).
 */

/** Review types, in display order. content.ts builds its zod enum from this. */
export const reviewTypes = ["book", "tv", "film"] as const;
export type ReviewType = (typeof reviewTypes)[number];

/**
 * Plain-English review type labels (badges, fallback covers, count text). The
 * internal type "film" is shown as "Movie" everywhere visitors can see it.
 */
export const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  book: "Book",
  tv: "TV",
  film: "Movie",
};

/** Visible topic label. Stored type "film" is shown as "movie" to match the UI. */
export function reviewTopic(type: ReviewType): string {
  return `review.${type === "film" ? "movie" : type}`;
}

/** One page per review type: where it lives and what it's called. */
export const REVIEW_TYPE_PAGE: Record<ReviewType, { href: string; title: string; allTitle: string }> =
  {
    book: { href: "/books/", title: "Books", allTitle: "All books" },
    film: { href: "/movies/", title: "Movies", allTitle: "All movies" },
    tv: { href: "/tv/", title: "TV", allTitle: "All shows" },
  };

/** Labels for reviews marked `current` (in progress). Books are read; the rest are watched. */
export function currentLabels(type: ReviewType) {
  return type === "book"
    ? { badge: "Now reading", heading: "Currently reading", topic: "status.reading" }
    : { badge: "Now watching", heading: "Currently watching", topic: "status.watching" };
}

/** "book review(s)", "movie review(s)", "TV review(s)" for count text. */
export function reviewNoun(type: ReviewType, count: number): string {
  const label = REVIEW_TYPE_LABEL[type];
  const word = label === label.toUpperCase() ? label : label.toLowerCase();
  return `${word} ${count === 1 ? "review" : "reviews"}`;
}

/** Event offset as shown on the site, e.g. 42 -> "#0042". */
export const offsetLabel = (n: number) => `#${String(n).padStart(4, "0")}`;

/** Rating out of 10 as written: "8" or "8.5" (at most one decimal). */
export const formatRating = (rating: number) =>
  Number.isInteger(rating) ? String(rating) : rating.toFixed(1);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2024-06" -> "Jun 2024"; "present" -> "Present". Locale-independent on purpose. */
export function formatYearMonth(value: string): string {
  if (value === "present") return "Present";
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1] ?? ""} ${year}`.trim();
}

/** "2026-10-01" -> "Oct 1, 2026". Parsed by hand so the build machine's time zone can't shift it. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1] ?? ""} ${day}, ${year}`;
}
