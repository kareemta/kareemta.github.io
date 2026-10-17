import LatestEvents from "@/components/LatestEvents/LatestEvents";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { getSite } from "@/lib/content";
import { getLatestEvents } from "@/lib/feed";
import styles from "./page.module.css";

export default function Home() {
  const site = getSite();

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-name">
        <p className={styles.role}>{site.headline}</p>
        <h1 id="hero-name" className={styles.name}>
          {site.displayName}
        </h1>
        <p className={styles.bio}>{site.bio}</p>
      </section>

      <section className={styles.now} aria-labelledby="now-heading">
        <SectionHeading id="now-heading" topic="status.now" title="Now" />
        <p className={styles.nowText}>{site.now}</p>
      </section>

      <LatestEvents events={getLatestEvents()} />
    </div>
  );
}
