"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ariaCurrentFor, type NavItem } from "@/lib/nav";
import styles from "./SiteNav.module.css";


/** Primary navigation; marks the current page or section with aria-current. */
export default function SiteNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Main">
      <ul className={styles.list}>
        {items.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className={styles.link} aria-current={ariaCurrentFor(pathname, href)}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
