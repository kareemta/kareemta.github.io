import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState/EmptyState";
import PageHeader from "@/components/PageHeader/PageHeader";
import ReviewBrowser from "@/components/ReviewBrowser/ReviewBrowser";
import { getReviews, getSite, publishable, type ReviewType } from "@/lib/content";
import { REVIEW_TYPE_PAGE, reviewNoun, reviewTopic } from "@/lib/format";
import { sortReviews } from "@/lib/reviews";

/** One-line intro per page: neutral, no personal facts. */
const INTRO: Record<ReviewType, string> = {
  book: "Books, each with a score out of 10 and a short take.",
  film: "Movies, each with a score out of 10 and a short take.",
  tv: "TV shows, each with a score out of 10 and a short take.",
};

export function reviewTypeMetadata(type: ReviewType): Metadata {
  return { title: `${REVIEW_TYPE_PAGE[type].title} · ${getSite().displayName}` };
}

/**
 * Shared body of /books, /movies and /tv: header, sort control and list for one
 * review type. All reviews live in content/reviews.json; this page shows one type.
 */
export default function ReviewTypePage({ type }: { type: ReviewType }) {
  // Placeholder and TODO(user) entries never reach the page.
  const reviews = sortReviews(
    publishable(getReviews()).filter((r) => r.type === type),
    "date",
  );

  return (
    <>
      <PageHeader title={REVIEW_TYPE_PAGE[type].title} topic={reviewTopic(type)}>
        {INTRO[type]}
      </PageHeader>
      {reviews.length > 0 ? (
        <ReviewBrowser reviews={reviews} type={type} />
      ) : (
        <EmptyState stream={`0 events · ${reviewTopic(type)} idle`}>
          No {reviewNoun(type, 0)} yet. They will show up here as they are added.
        </EmptyState>
      )}
    </>
  );
}
