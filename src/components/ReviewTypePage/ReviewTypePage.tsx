import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState/EmptyState";
import PageHeader from "@/components/PageHeader/PageHeader";
import ReviewBrowser from "@/components/ReviewBrowser/ReviewBrowser";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { getReviews, publishable, type ReviewType } from "@/lib/content";
import { currentLabels, REVIEW_TYPE_PAGE, reviewNoun, reviewTopic } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { sortReviews } from "@/lib/reviews";
import styles from "./ReviewTypePage.module.css";

/** One-line intro per page: neutral, no personal facts. */
const INTRO: Record<ReviewType, string> = {
  book: "Books, each with a score out of 10 and a short take.",
  film: "Movies, each with a score out of 10 and a short take.",
  tv: "TV shows, each with a score out of 10 and a short take.",
};

/** Neutral, factual page descriptions for search and link previews. */
const DESCRIPTION: Record<ReviewType, string> = {
  book: "Book reviews, each with a score out of 10 and a short take.",
  film: "Movie reviews, each with a score out of 10 and a short take.",
  tv: "TV show reviews, each with a score out of 10 and a short take.",
};

export function reviewTypeMetadata(type: ReviewType): Metadata {
  const page = REVIEW_TYPE_PAGE[type];
  return pageMetadata({ title: page.title, description: DESCRIPTION[type], path: page.href });
}

/**
 * Shared body of /books, /movies and /tv for one review type (all reviews live in
 * content/reviews.json). Reviews marked `current` are pinned in their own section
 * at the top and left out of the sortable list below.
 */
export default function ReviewTypePage({ type }: { type: ReviewType }) {
  // Placeholder and TODO(user) entries never reach the page.
  const all = sortReviews(
    publishable(getReviews()).filter((r) => r.type === type),
    "date",
  );
  const current = all.filter((r) => r.current);
  const rest = all.filter((r) => !r.current);
  const labels = currentLabels(type);
  const page = REVIEW_TYPE_PAGE[type];

  return (
    <div className={styles.page}>
      <PageHeader title={page.title} topic={reviewTopic(type)}>
        {INTRO[type]}
      </PageHeader>

      {all.length === 0 ? (
        <EmptyState stream={`0 events · ${reviewTopic(type)} idle`}>
          No {reviewNoun(type, 0)} yet. They will show up here as they are added.
        </EmptyState>
      ) : (
        <>
          {current.length > 0 && (
            <section aria-labelledby="current-heading">
              <SectionHeading id="current-heading" topic={labels.topic} title={labels.heading} />
              <ul className={styles.list}>
                {current.map((review) => (
                  <li key={review.id}>
                    <ReviewCard review={review} headingLevel={3} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="all-heading">
            <SectionHeading id="all-heading" topic={reviewTopic(type)} title={page.allTitle} />
            {rest.length > 0 ? (
              <ReviewBrowser reviews={rest} type={type} />
            ) : (
              <EmptyState stream={`0 events · ${reviewTopic(type)}`}>
                No other {reviewNoun(type, 0)} yet.
              </EmptyState>
            )}
          </section>
        </>
      )}
    </div>
  );
}
