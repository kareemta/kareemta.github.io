import styles from "./SectionHeading.module.css";

type SectionHeadingProps = {
  /** Plain-English heading, e.g. "Latest". */
  title: string;
  /** Optional stream-style label shown above it, e.g. "events.latest". Decorative. */
  topic?: string;
  /** id for aria-labelledby on the enclosing section. */
  id?: string;
};

/** Section h2 with an optional mono topic label (always paired with the plain title). */
export default function SectionHeading({ title, topic, id }: SectionHeadingProps) {
  return (
    <div className={styles.heading}>
      {topic && (
        <p className={styles.topic} aria-hidden="true">
          {topic}
        </p>
      )}
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
    </div>
  );
}
