import type { ReactNode } from "react";
import styles from "./Container.module.css";

/** Centers content at the site's max width with responsive side gutters. */
export default function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `${styles.container} ${className}` : styles.container}>{children}</div>;
}
