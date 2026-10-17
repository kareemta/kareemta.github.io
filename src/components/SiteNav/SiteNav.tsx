"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SiteNav.module.css";

export type NavItem = { href: string; label: string };

/** Strip the trailing slash (trailingSlash: true) so "/work/" and "/work" compare equal. */
function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * Primary navigation. The link for the current page gets aria-current="page";
 * a section link gets aria-current="true" when you are deeper inside it
 * (e.g. a single post under /writing).
 */
export default function SiteNav({ items }: { items: NavItem[] }) {
  const pathname = normalize(usePathname() ?? "/");

  return (
    <nav aria-label="Main" className={styles.nav}>
      <ul className={styles.list}>
        {items.map(({ href, label }) => {
          const target = normalize(href);
          const current =
            pathname === target ? "page" : pathname.startsWith(`${target}/`) ? "true" : undefined;
          return (
            <li key={href}>
              <Link href={href} className={styles.link} aria-current={current}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
