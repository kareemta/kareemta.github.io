import { getContentLogLines } from "@/lib/content";
import LogStreamClient from "./LogStreamClient";

/**
 * Signature "live log" background (SITE_SPEC.md). Lines from real content are
 * read at build time here and handed to the client-side canvas.
 */
export default function LogStream() {
  return <LogStreamClient lines={getContentLogLines()} />;
}
