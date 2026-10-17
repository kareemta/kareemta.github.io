import EventCard from "@/components/EventCard/EventCard";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import type { FeedEvent } from "@/lib/feed";
import styles from "./LatestEvents.module.css";

/** Home-page feed of the newest review, trip, post and project. */
export default function LatestEvents({ events }: { events: FeedEvent[] }) {
  return (
    <section aria-labelledby="latest-heading">
      <SectionHeading id="latest-heading" topic="events.latest" title="Latest" />
      {events.length > 0 ? (
        <ol className={styles.list}>
          {events.map((event) => (
            <li key={`${event.kind}:${event.title}`}>
              <EventCard event={event} />
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyStream} aria-hidden="true">
            0 events · stream idle
          </p>
          <p className={styles.emptyText}>
            Nothing here yet. New reviews, trips, posts and projects will show up here.
          </p>
        </div>
      )}
    </section>
  );
}
