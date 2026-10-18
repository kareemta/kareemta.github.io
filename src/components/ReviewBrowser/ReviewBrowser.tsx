"use client";

import { useId, useState } from "react";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import type { Review, ReviewType } from "@/lib/content";
import { reviewNoun } from "@/lib/format";
import { sortReviews, type ReviewSort } from "@/lib/reviews";
import styles from "./ReviewBrowser.module.css";

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: "date", label: "Newest" },
  { value: "rating", label: "Highest rated" },
];

type ReviewBrowserProps = {
  /** Reviews of one type, already newest first. */
  reviews: Review[];
  type: ReviewType;
};

/**
 * Sort control (newest / highest rated) and list for one review type, as a
 * native radio group. The first render matches the static HTML (newest first),
 * so the page works and reads correctly without JS.
 */
export default function ReviewBrowser({ reviews, type }: ReviewBrowserProps) {
  const [sort, setSort] = useState<ReviewSort>("date");
  const id = useId();
  const shown = sortReviews(reviews, sort);

  return (
    <div>
      <div className={styles.controls}>
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
        Showing {shown.length} {reviewNoun(type, shown.length)}
        {shown.length > 1 ? `, ${sort === "rating" ? "highest rated" : "newest"} first` : ""}
      </p>

      <ol className={styles.list}>
        {shown.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} headingLevel={2} />
          </li>
        ))}
      </ol>
    </div>
  );
}
