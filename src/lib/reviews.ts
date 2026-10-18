/** Review sorting for the Books / Movies / TV pages. Client-safe (type-only content import). */
import type { Review } from "@/lib/content";

export type ReviewSort = "date" | "rating";

/** Newest first; ties broken by the higher offset (added later). */
const byDate = (a: Review, b: Review) =>
  b.dateReviewed.localeCompare(a.dateReviewed) || b.offset - a.offset;

/** Highest rating first; ties broken by date. */
const byRating = (a: Review, b: Review) => b.rating - a.rating || byDate(a, b);

export function sortReviews(reviews: Review[], sort: ReviewSort): Review[] {
  return [...reviews].sort(sort === "rating" ? byRating : byDate);
}
