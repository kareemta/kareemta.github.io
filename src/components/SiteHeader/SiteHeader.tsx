import Container from "@/components/Container/Container";
import SiteNav from "@/components/SiteNav/SiteNav";
import Wordmark from "@/components/Wordmark/Wordmark";
import { NAV_ITEMS } from "@/lib/nav";
import styles from "./SiteHeader.module.css";

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
