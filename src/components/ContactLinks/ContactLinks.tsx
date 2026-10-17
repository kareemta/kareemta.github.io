import type { Link } from "@/lib/content";
import styles from "./ContactLinks.module.css";

/** "https://www.linkedin.com/in/x/" -> "linkedin.com/in/x". Shown under the label. */
function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

/** Large link cards for profiles (LinkedIn, GitHub) from site.json contact.links. */
export default function ContactLinks({ links }: { links: Link[] }) {
  return (
    <ul className={styles.list}>
      {links.map((link) => (
        <li key={link.url}>
          <a href={link.url} rel="me" className={styles.card}>
            <span className={styles.label}>{link.label}</span>{" "}
            <span className={styles.url}>{displayUrl(link.url)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
