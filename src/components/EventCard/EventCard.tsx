import Link from "next/link";
import type { FeedEvent } from "@/lib/feed";
import styles from "./EventCard.module.css";

/**
 * Compact event row: a mono header (`#0042 · review.book · 2026-10-12`) next to a
 * plain label ("Book review"), then the title (linking to its section) and one
 * supporting line. Generic over all feed kinds; 3.1 can render <ReviewCard> for
 * kind === "review" instead.
 */
export default function EventCard({ event }: { event: FeedEvent }) {
  const meta = [event.offset, event.topic, event.date].filter(Boolean).join(" · ");

  return (
    <article className={styles.card}>
      <p className={styles.meta}>
        <span className={styles.label}>{event.label}</span>
        <span className={styles.stream} aria-hidden="true">
          {meta}
        </span>
        {event.date && <span className="visually-hidden">, {event.date}</span>}
      </p>
      <h3 className={styles.title}>
        <Link href={event.href} className={styles.link}>
          {event.title}
        </Link>
      </h3>
      {event.detail && <p className={styles.detail}>{event.detail}</p>}
    </article>
  );
}
