import Container from "@/components/Container/Container";
import SiteNav, { type NavItem } from "@/components/SiteNav/SiteNav";
import Wordmark from "@/components/Wordmark/Wordmark";
import styles from "./SiteHeader.module.css";

/** Site sections, in the order they appear in the nav. Pages arrive in Phase 3. */
const NAV_ITEMS: NavItem[] = [
  { href: "/work/", label: "Work" },
  { href: "/writing/", label: "Writing" },
  { href: "/reviews/", label: "Reviews" },
  { href: "/travel/", label: "Travel" },
  { href: "/contact/", label: "Contact" },
];

/** Top bar: mono `kareem/` wordmark (links home) and the main nav. */
export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Wordmark />
        <SiteNav items={NAV_ITEMS} />
      </Container>
    </header>
  );
}
