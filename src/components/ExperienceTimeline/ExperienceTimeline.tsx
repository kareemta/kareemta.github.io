import EmptyState from "@/components/EmptyState/EmptyState";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import type { ExperienceEntry } from "@/lib/content";
import { formatYearMonth } from "@/lib/format";
import styles from "./ExperienceTimeline.module.css";

const KIND_LABEL: Record<ExperienceEntry["kind"], string> = {
  work: "Work",
  education: "Education",
};

/**
 * Experience as a vertical timeline (newest first). Shows exactly what
 * experience.json holds: title, organisation, dates and summary lines. Nothing
 * is added or inferred (Ford confidentiality rule).
 */
export default function ExperienceTimeline({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <section aria-labelledby="experience-heading">
      <SectionHeading id="experience-heading" topic="experience.log" title="Experience" />
      {entries.length > 0 ? (
        <ol className={styles.timeline}>
          {entries.map((entry) => (
            <li key={`${entry.org}-${entry.title}-${entry.start}`} className={styles.item}>
              <article className={styles.card}>
                <p className={styles.meta}>
                  <span className={styles.badge}>{KIND_LABEL[entry.kind]}</span>
                  <span className={styles.stream} aria-hidden="true">
                    {entry.kind}.role · {entry.start} → {entry.end}
                  </span>
                </p>
                <h3 className={styles.title}>{entry.title}</h3>
                <p className={styles.org}>
                  {entry.org} ·{" "}
                  <time dateTime={entry.start}>{formatYearMonth(entry.start)}</time> –{" "}
                  {entry.end === "present" ? (
                    "Present"
                  ) : (
                    <time dateTime={entry.end}>{formatYearMonth(entry.end)}</time>
                  )}
                </p>
                {entry.summary.length > 0 && (
                  <ul className={styles.summary}>
                    {entry.summary.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState stream="0 events · experience.log idle">
          Experience details are on their way.
        </EmptyState>
      )}
    </section>
  );
}
