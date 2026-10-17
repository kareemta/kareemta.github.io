/** Review sorting and filtering for /reviews. Client-safe (type-only content import). */
import type { Review, ReviewType } from "@/lib/content";

export type ReviewSort = "date" | "rating";
export type ReviewFilter = ReviewType | "all";

/** Newest first; ties broken by the higher offset (added later). */
const byDate = (a: Review, b: Review) =>
  b.dateReviewed.localeCompare(a.dateReviewed) || b.offset - a.offset;

/** Highest rating first; ties broken by date. */
const byRating = (a: Review, b: Review) => b.rating - a.rating || byDate(a, b);

export function sortReviews(reviews: Review[], sort: ReviewSort): Review[] {
  return [...reviews].sort(sort === "rating" ? byRating : byDate);
}

export function filterReviews(reviews: Review[], filter: ReviewFilter): Review[] {
  return filter === "all" ? reviews : reviews.filter((r) => r.type === filter);
}
