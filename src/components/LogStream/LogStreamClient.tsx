"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { LogLine } from "@/lib/logLines";
import { normalizePath } from "@/lib/nav";
import styles from "./LogStream.module.css";

// Uses window and canvas, so it is only loaded and rendered in the browser.
const LogStreamCanvas = dynamic(() => import("./LogStreamCanvas"), { ssr: false });

/** Fixed, decorative layer behind the page. Stronger on home, dimmer elsewhere. */
export default function LogStreamClient({ lines }: { lines: LogLine[] }) {
  const isHome = normalizePath(usePathname() ?? "/") === "/";

  return (
    <div className={`${styles.stream} ${isHome ? styles.home : styles.inner}`} aria-hidden="true">
      <LogStreamCanvas lines={lines} />
    </div>
  );
}
