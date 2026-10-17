import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState/EmptyState";
import PageHeader from "@/components/PageHeader/PageHeader";
import ReviewBrowser from "@/components/ReviewBrowser/ReviewBrowser";
import { getReviews, getSite, publishable } from "@/lib/content";
import { sortReviews } from "@/lib/reviews";

export function generateMetadata(): Metadata {
  return { title: `Reviews · ${getSite().displayName}` };
}

export default function ReviewsPage() {
  // Placeholder and TODO(user) entries never reach the page.
  const reviews = sortReviews(publishable(getReviews()), "date");

  return (
    <>
      <PageHeader title="Reviews" topic="review.*">
        Books, TV and films, each with a score out of 10 and a short take.
      </PageHeader>
      {reviews.length > 0 ? (
        <ReviewBrowser reviews={reviews} />
      ) : (
        <EmptyState stream="0 events · review.* idle">
          No reviews yet. They will show up here as they are added.
        </EmptyState>
      )}
    </>
  );
}
