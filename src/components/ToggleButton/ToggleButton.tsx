import styles from "./ToggleButton.module.css";

type ToggleButtonProps = {
  /** Accessible name and visible label, e.g. "Dark mode". Keep it constant. */
  label: string;
  /** Current on/off state; null while unknown (before hydration). */
  pressed: boolean | null;
  /** Short visible state text, e.g. "on" / "off". Hidden from screen readers (aria-pressed says it). */
  stateText: string;
  /** Room reserved for the state text, in characters, so the button keeps its size. */
  stateWidth?: number;
  onClick: () => void;
};

/** Small mono on/off button used for site-wide preferences in the footer. */
export default function ToggleButton({ label, pressed, stateText, stateWidth = 3, onClick }: ToggleButtonProps) {
  return (
    <button type="button" className={styles.toggle} aria-pressed={pressed ?? false} onClick={onClick}>
      <span className={styles.label}>{label}</span>
      <span className={styles.state} style={{ minWidth: `${stateWidth}ch` }} aria-hidden="true">
        {pressed === null ? "" : stateText}
      </span>
    </button>
  );
}
