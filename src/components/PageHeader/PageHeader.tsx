import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  /** Plain-English page title (h1, display font). */
  title: string;
  /** Optional stream-style label above it, e.g. "review.*". Decorative. */
  topic?: string;
  /** Optional one-line intro under the title. */
  children?: ReactNode;
};

/** Top of an inner page: mono topic label, h1 title, short intro. */
export default function PageHeader({ title, topic, children }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {topic && (
        <p className={styles.topic} aria-hidden="true">
          {topic}
        </p>
      )}
      <h1 className={styles.title}>{title}</h1>
      {children && <p className={styles.intro}>{children}</p>}
    </header>
  );
}
