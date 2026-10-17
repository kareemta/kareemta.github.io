"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ariaCurrentFor } from "@/lib/nav";
import styles from "./Wordmark.module.css";

/** Mono `kareem/` wordmark linking home; aria-current="page" on the home page. */
export default function Wordmark() {
  const pathname = usePathname() ?? "/";

  return (
    <Link href="/" className={styles.wordmark} aria-current={ariaCurrentFor(pathname, "/")}>
      kareem<span className={styles.slash}>/</span>
      <span className="visually-hidden"> home</span>
    </Link>
  );
}
