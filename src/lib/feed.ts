/**
 * "Latest events" feed for the home page: the newest real entry of each kind
 * (review, trip, post, project), newest first. Server-only (reads content).
 *
 * Each item carries both a topic-style label (`review.book`) and a plain-English
 * one ("Book review"), per the spec's vocabulary rule. `kind` lets a page swap in
 * a richer card for one kind later (e.g. <ReviewCard> in task 3.1).
 */
import {
  getPosts,
  getProjects,
  getReviews,
  getTravel,
  offsetLabel,
  publishable,
  type ReviewType,
} from "@/lib/content";

export type FeedKind = "review" | "trip" | "post" | "project";

export type FeedEvent = {
  kind: FeedKind;
  /** Stream-style label, e.g. "review.book". */
  topic: string;
  /** Plain-English label shown next to the topic, e.g. "Book review". */
  label: string;
  /** e.g. "#0042"; only reviews have one today. */
  offset?: string;
  /** Display date: YYYY-MM-DD, or just a year for trips. Absent when unknown. */
  date?: string;
  title: string;
  /** One short supporting line. */
  detail?: string;
  /** Section page the item links to. */
  href: string;
};

const REVIEW_LABEL: Record<ReviewType, string> = {
  book: "Book review",
  tv: "TV review",
  film: "Film review",
};

/**
 * Newest first, comparing `date` as a string. Trips only have a year ("2024"),
 * which sorts as a string prefix: after any full date in the same year
 * ("2024" < "2024-03-01"), before any earlier year. Projects have no date at all
 * and always sort last. Good enough for a 4-item feed; revisit if trips get dates.
 */
const byDateDesc = (a: FeedEvent, b: FeedEvent) => (b.date ?? "").localeCompare(a.date ?? "");

export function getLatestEvents(): FeedEvent[] {
  const events: FeedEvent[] = [];

  const review = publishable(getReviews()).toSorted((a, b) =>
    b.dateReviewed.localeCompare(a.dateReviewed),
  )[0];
  if (review) {
    events.push({
      kind: "review",
      topic: `review.${review.type}`,
      label: REVIEW_LABEL[review.type],
      offset: offsetLabel(review.offset),
      date: review.dateReviewed,
      title: review.title,
      detail: `${review.creator} · ${review.rating.toFixed(1)}/10`,
      href: "/reviews/",
    });
  }

  // Trips only have a year; on a tie, the one listed first in travel.json wins.
  const trip = publishable(getTravel()).toSorted((a, b) => b.year - a.year)[0];
  if (trip) {
    events.push({
      kind: "trip",
      topic: "travel.visited",
      label: "Trip",
      date: String(trip.year),
      title: `${trip.name}, ${trip.country}`,
      detail: trip.highlight,
      href: "/travel/",
    });
  }

  // getPosts() already hides drafts and sorts newest first.
  const post = publishable(getPosts())[0];
  if (post) {
    events.push({
      kind: "post",
      topic: "post.published",
      label: "Post",
      date: post.date,
      title: post.title,
      detail: post.summary,
      href: "/writing/",
    });
  }

  // Projects have no date; the first one listed in projects.json counts as newest.
  const project = publishable(getProjects())[0];
  if (project) {
    events.push({
      kind: "project",
      topic: "project.added",
      label: "Project",
      title: project.name,
      detail: project.oneLiner,
      href: "/work/",
    });
  }

  return events.toSorted(byDateDesc);
}
