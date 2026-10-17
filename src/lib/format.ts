/**
 * Small display helpers and constants shared by server and client components.
 * Client-safe: never import runtime values from content.ts (it reads files).
 */

/** Review types, in display order. content.ts builds its zod enum from this. */
export const reviewTypes = ["book", "tv", "film"] as const;
export type ReviewType = (typeof reviewTypes)[number];

/** Plain-English review type badges. */
export const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  book: "Book",
  tv: "TV",
  film: "Film",
};

/** Event offset as shown on the site, e.g. 42 -> "#0042". */
export const offsetLabel = (n: number) => `#${String(n).padStart(4, "0")}`;

/** Rating out of 10 as written: "8" or "8.5" (at most one decimal). */
export const formatRating = (rating: number) =>
  Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
