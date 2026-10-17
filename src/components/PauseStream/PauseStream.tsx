"use client";

import { useSyncExternalStore } from "react";
import ToggleButton from "@/components/ToggleButton/ToggleButton";
import { isStreamPaused, setStreamPaused, subscribeStream } from "@/lib/stream";
import styles from "./PauseStream.module.css";

function getServerPaused(): boolean | null {
  return null;
}

/**
 * Footer control that pauses the background log stream (spec: "a small pause
 * stream control in the footer"). Accessible name "Pause stream" with
 * aria-pressed=true while paused; sighted users see "[live]" or "[paused]".
 * Hidden under prefers-reduced-motion, where the stream is always frozen and
 * the button would do nothing.
 */
export default function PauseStream() {
  const paused = useSyncExternalStore(subscribeStream, isStreamPaused, getServerPaused);

  return (
    <span className={styles.wrap}>
      <ToggleButton
        label="Pause stream"
        pressed={paused}
        stateText={paused ? "[paused]" : "[live]"}
        stateWidth={8}
        onClick={() => setStreamPaused(!isStreamPaused())}
      />
    </span>
  );
}
