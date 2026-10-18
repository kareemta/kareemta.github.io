import Link from "next/link";
import ReviewCover from "@/components/ReviewCover/ReviewCover";
import type { Review } from "@/lib/content";
import {
  currentLabels,
  formatRating,
  offsetLabel,
  REVIEW_TYPE_LABEL,
  reviewTopic,
} from "@/lib/format";
import styles from "./ReviewCard.module.css";

type ReviewCardProps = {
  review: Review;
  /** "full" on the Books / Movies / TV pages; "compact" (smaller cover, no take) in feeds. */
  variant?: "full" | "compact";
  /** Heading level for the title, to fit the page outline. */
  headingLevel?: 2 | 3;
  /** When set, the title links here and the whole card is clickable. */
  href?: string;
};

/**
 * A review styled as an event: a plain type badge beside the mono header
 * `#0042 · review.book · 2026-10-12`, then cover, title, creator, year,
 * rating out of 10, the take and the date reviewed. Server- and client-safe.
 */
export default function ReviewCard({
  review,
  variant = "full",
  headingLevel = 2,
  href,
}: ReviewCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const rating = formatRating(review.rating);
  const compact = variant === "compact";

  return (
    <article className={compact ? `${styles.card} ${styles.compact}` : styles.card}>
      <p className={styles.meta}>
        <span className={styles.badge}>{REVIEW_TYPE_LABEL[review.type]}</span>
        {review.current && (
          <span className={styles.nowBadge}>{currentLabels(review.type).badge}</span>
        )}
        <span className={styles.stream} aria-hidden="true">
          {offsetLabel(review.offset)} · {reviewTopic(review.type)} · {review.dateReviewed}
        </span>
      </p>

      <div className={styles.body}>
        <ReviewCover review={review} sizes={compact ? "72px" : "120px"} compact={compact} />

        <div className={styles.text}>
          <Heading className={styles.title}>
            {href ? (
              <Link href={href} className={styles.link}>
                {review.title}
              </Link>
            ) : (
              review.title
            )}
          </Heading>
          <p className={styles.creator}>
            {review.creator} · {review.year}
          </p>
          <p className={styles.rating}>
            <span aria-hidden="true">
              <span className={styles.score}>{rating}</span>/10
            </span>
            <span className="visually-hidden">Rated {rating} out of 10</span>
          </p>
          {!compact && <p className={styles.take}>{review.take}</p>}
          <p className={styles.date}>
            Reviewed <time dateTime={review.dateReviewed}>{review.dateReviewed}</time>
          </p>
        </div>
      </div>
    </article>
  );
}
