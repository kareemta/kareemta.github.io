import type { ReactNode } from "react";
import styles from "./Prose.module.css";

/** Long-form typography for rendered posts (headings, lists, quotes, code, images). */
export default function Prose({ children }: { children: ReactNode }) {
  return <div className={styles.prose}>{children}</div>;
}
