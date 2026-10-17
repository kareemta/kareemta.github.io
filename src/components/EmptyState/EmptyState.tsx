import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  /** Decorative stream-style line, e.g. "0 events · stream idle". */
  stream: string;
  /** Plain-English message (what screen readers hear). */
  children: ReactNode;
};

/** Dashed placeholder box for lists with nothing to show yet. */
export default function EmptyState({ stream, children }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.stream} aria-hidden="true">
        {stream}
      </p>
      <p className={styles.text}>{children}</p>
    </div>
  );
}
