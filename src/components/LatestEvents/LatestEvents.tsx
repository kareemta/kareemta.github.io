import EmptyState from "@/components/EmptyState/EmptyState";
import EventCard from "@/components/EventCard/EventCard";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import type { FeedEvent } from "@/lib/feed";
import styles from "./LatestEvents.module.css";

/** Home-page feed of the newest review and the top-rated trip. */
export default function LatestEvents({ events }: { events: FeedEvent[] }) {
  return (
    <section aria-labelledby="latest-heading">
      <SectionHeading id="latest-heading" topic="events.latest" title="Latest" />
      {events.length > 0 ? (
        <ol className={styles.list}>
          {events.map((event) => (
            <li key={`${event.kind}:${event.title}`}>
              {event.review ? (
                <ReviewCard
                  review={event.review}
                  variant="compact"
                  headingLevel={3}
                  href={event.href}
                />
              ) : (
                <EventCard event={event} />
              )}
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState stream="0 events · stream idle">
          Nothing here yet. New reviews and trips will show up here.
        </EmptyState>
      )}
    </section>
  );
}
