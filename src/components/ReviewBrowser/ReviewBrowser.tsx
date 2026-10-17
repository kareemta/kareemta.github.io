"use client";

import { useId, useState } from "react";
import EmptyState from "@/components/EmptyState/EmptyState";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import type { Review } from "@/lib/content";
import { REVIEW_TYPE_LABEL, reviewTypes } from "@/lib/format";
import { filterReviews, sortReviews, type ReviewFilter, type ReviewSort } from "@/lib/reviews";
import styles from "./ReviewBrowser.module.css";

const FILTERS: { value: ReviewFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...reviewTypes.map((t) => ({ value: t, label: REVIEW_TYPE_LABEL[t] })),
];

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: "date", label: "Newest" },
  { value: "rating", label: "Highest rated" },
];

/** "3 reviews", "1 book review", "2 TV reviews". */
function countLabel(n: number, filter: ReviewFilter): string {
  const kind = filter === "all" ? "" : `${filter === "tv" ? "TV" : filter} `;
  return `${n} ${kind}${n === 1 ? "review" : "reviews"}`;
}

/**
 * Filter (All / Book / TV / Film) and sort (newest / highest rated) for the
 * reviews list, with native radio groups. The first render matches the static
 * HTML (all, newest first), so the page works and reads correctly without JS.
 */
export default function ReviewBrowser({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [sort, setSort] = useState<ReviewSort>("date");
  const id = useId();

  const shown = sortReviews(filterReviews(reviews, filter), sort);

  return (
    <div className={styles.browser}>
      <div className={styles.controls}>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>Type</legend>
          <div className={styles.options}>
            {FILTERS.map((f) => (
              <label key={f.value} className={styles.option}>
                <input
                  type="radio"
                  name={`${id}-type`}
                  value={f.value}
                  checked={filter === f.value}
                  onChange={() => setFilter(f.value)}
                  className={styles.input}
                />
                {f.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>Sort by</legend>
          <div className={styles.options}>
            {SORTS.map((s) => (
              <label key={s.value} className={styles.option}>
                <input
                  type="radio"
                  name={`${id}-sort`}
                  value={s.value}
                  checked={sort === s.value}
                  onChange={() => setSort(s.value)}
                  className={styles.input}
                />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <p className={styles.count} role="status" aria-live="polite">
        Showing {countLabel(shown.length, filter)}
      </p>

      {shown.length > 0 ? (
        <ol className={styles.list}>
          {shown.map((review) => (
            <li key={review.id}>
              <ReviewCard review={review} headingLevel={2} />
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState stream={`0 events · review.${filter === "all" ? "*" : filter}`}>
          No {countLabel(0, filter).replace(/^0 /, "")} yet.
        </EmptyState>
      )}
    </div>
  );
}
