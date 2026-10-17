import Image from "next/image";
import type { Review } from "@/lib/content";
import { REVIEW_TYPE_LABEL } from "@/lib/format";
import styles from "./ReviewCover.module.css";

/**
 * 2:3 cover. Uses the local image from public/covers/ when the review has one
 * (never hotlinked); otherwise a generated typographic cover: the title and type
 * on an accent block, in --color-on-accent (AA on accent in both themes).
 */
export default function ReviewCover({
  review,
  sizes,
  compact = false,
}: {
  review: Review;
  sizes: string;
  /** Small (feed) cover: fewer title lines fit. */
  compact?: boolean;
}) {
  if (review.cover) {
    return (
      <div className={styles.cover}>
        <Image
          src={review.cover}
          alt={`Cover of ${review.title}`}
          fill
          sizes={sizes}
          className={styles.image}
        />
      </div>
    );
  }

  // Decorative: the title and type are already in the card text.
  return (
    <div
      className={`${styles.cover} ${styles.fallback} ${compact ? styles.compact : ""}`}
      aria-hidden="true"
    >
      <span className={styles.type}>{REVIEW_TYPE_LABEL[review.type]}</span>
      <span className={styles.title}>{review.title}</span>
    </div>
  );
}
