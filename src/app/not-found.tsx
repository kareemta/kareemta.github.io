import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
  // Don't inherit the home page's canonical URL from the layout.
  alternates: { canonical: null },
};

/** Site-styled 404 (static export writes it to out/404.html). */
export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" topic="404 · route.not_found">
        This page doesn&apos;t exist. The link may be wrong or the page may have moved.
      </PageHeader>
      <nav aria-label="Pages on this site">
        <ul className={styles.links}>
          <li>
            <Link href="/" className={styles.link}>
              Home
            </Link>
          </li>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
