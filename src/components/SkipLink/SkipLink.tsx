import styles from "./SkipLink.module.css";

/** First focusable element on every page: jumps keyboard users past the header. */
export default function SkipLink({ targetId = "main" }: { targetId?: string }) {
  return (
    <a className={styles.skip} href={`#${targetId}`}>
      Skip to content
    </a>
  );
}
