import Container from "@/components/Container/Container";
import PauseStream from "@/components/PauseStream/PauseStream";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import { TODO, getSite } from "@/lib/content";
import styles from "./SiteFooter.module.css";

/** Bottom bar: profile links from content/site.json, plus the stream and theme controls. */
export default function SiteFooter() {
  const site = getSite();
  // Links still marked TODO(user) are not real yet, so leave them out.
  const links = site.contact.links.filter((link) => link.url !== TODO);

  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        {links.length > 0 && (
          <nav aria-label="Elsewhere">
            <ul className={styles.links}>
              {links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} className={styles.link} rel="me noopener">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className={styles.controls}>
          <PauseStream />
          <ThemeToggle />
        </div>
      </Container>
    </footer>
  );
}
