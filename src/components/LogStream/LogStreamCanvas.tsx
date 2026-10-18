"use client";

import { useEffect, useRef } from "react";
import { randomInfraLine, type LogLine } from "@/lib/logLines";
import { whenLoadedAndIdle } from "@/lib/idle";
import { isStreamFrozen, subscribeStreamFrozen } from "@/lib/stream";
import styles from "./LogStream.module.css";

/* Tuning. Speed and spawn interval together give ~1 new line per 0.8–1.5 s. */
const FONT_PX = 12;
const SPEED_PX_PER_S = 20;
const SPAWN_MIN_S = 0.8;
const SPAWN_MAX_S = 1.5;
const CONTENT_SHARE = 0.3; // fraction of lines taken from real content, when there is any
// ~15 fps (with slack for 60 Hz jitter). At 20 px/s that is ~1.3 px per frame, and
// lines are snapped to whole device pixels, so the drift stays crisp, not steppy.
const FRAME_MS = 1000 / 15 - 4;
const MAX_DT_S = 0.1; // a long frame never makes lines jump
const PAD_X = 16;
const MAX_DPR = 2; // sharper than 2x costs fill rate for no visible gain on faint text
const STAMP_COLS = 14; // "HH:MM:SS.mmm" plus a gap
const TOPIC_COLS = 22;
const LINE_COLS = 84; // width of one log column, in characters; wide screens fit several

/** `lane` is a random number in [0, 1) mapped to a column at draw time, so resizing reflows. */
type Row = { spawnT: number; lane: number; stamp: string; topic: string; message: string };

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
function stampFor(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

/** Shuffled, endless cycle over the real-content lines. */
function contentCycler(lines: LogLine[]): () => LogLine | null {
  if (lines.length === 0) return () => null;
  let order: LogLine[] = [];
  return () => {
    if (order.length === 0) {
      order = [...lines];
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    return order.pop() ?? null;
  };
}

function readColors() {
  const css = getComputedStyle(document.documentElement);
  return {
    ink: css.getPropertyValue("--color-ink").trim() || "currentColor",
    accent: css.getPropertyValue("--color-accent").trim() || "currentColor",
  };
}

/**
 * The drifting log itself: one <canvas>, redrawn from requestAnimationFrame.
 * The stream clock only advances while running, so pausing, hiding the tab or
 * reduced motion freeze the picture exactly where it is (a static snapshot).
 */
export default function LogStreamCanvas({ lines }: { lines: LogLine[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const nextContent = contentCycler(lines);
    const nextLine = (): LogLine =>
      (Math.random() < CONTENT_SHARE ? nextContent() : null) ?? randomInfraLine();
    const nextGap = () => SPAWN_MIN_S + Math.random() * (SPAWN_MAX_S - SPAWN_MIN_S);

    let width = 0;
    let height = 0;
    let charW = FONT_PX * 0.6;
    let colors = readColors();

    let t = 0; // stream clock in seconds
    let nextSpawnT = 0;
    let rows: Row[] = [];

    const makeRow = (at: number): Row => {
      const line = nextLine();
      const realMs = Date.now() + (at - t) * 1000;
      return { spawnT: at, lane: Math.random(), stamp: stampFor(realMs), topic: line.topic, message: line.message };
    };
    const spawn = (at: number) => rows.push(makeRow(at));

    /** Oldest spawn time still on screen for the current height. */
    const visibleSince = () => t - (height + FONT_PX * 2) / SPEED_PX_PER_S;

    /** Fill the screen with lines that "already arrived", so it never starts empty. */
    const prefill = () => {
      rows = [];
      let at = visibleSince();
      while (at <= t) {
        spawn(at);
        at += nextGap();
      }
      nextSpawnT = at;
    };

    /**
     * After the canvas grows taller, add older lines above the oldest one so the new
     * area at the top is filled. Existing lines are kept as they are (no reshuffle).
     */
    const backfill = () => {
      const older: Row[] = [];
      let at = (rows[0]?.spawnT ?? t) - nextGap();
      while (at >= visibleSince()) {
        older.push(makeRow(at));
        at -= nextGap();
      }
      if (older.length) rows = [...older.reverse(), ...rows];
    };

    const setFont = () => {
      const family = getComputedStyle(canvas).fontFamily || "monospace";
      ctx.font = `${FONT_PX}px ${family}`;
      charW = ctx.measureText("0").width || FONT_PX * 0.6;
    };

    /** True once the canvas has had a real size and the first screen was filled. */
    let ready = false;
    /** The animation only starts after page load + idle (the first static frame draws right away). */
    let mayAnimate = false;
    let dpr = 1;
    /** Stream time at the last draw; frames that moved less than a device pixel are skipped. */
    let drawnAtT = -Infinity;

    /**
     * Apply a new CSS size (from the ResizeObserver) or a new pixel ratio. Sizes under
     * 2px are transient layout states (e.g. mid full-page screenshot) and are ignored.
     * Lines stay anchored to the bottom; growing only adds older lines on top.
     */
    const applySize = (w: number, h: number) => {
      if (w < 2 || h < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const oldHeight = height;
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setFont(); // resizing a canvas resets its context state
      if (!ready) {
        ready = true;
        prefill();
        sync();
      } else if (height > oldHeight) {
        backfill();
      }
      draw();
    };

    const draw = () => {
      drawnAtT = t;
      ctx.clearRect(0, 0, width, height);
      const columns = Math.max(1, Math.floor((width - PAD_X) / (charW * LINE_COLS)));
      const columnW = (width - PAD_X) / columns;
      for (const row of rows) {
        // Snap to whole device pixels: crisp glyphs at a low frame rate.
        const y = Math.round((height - (t - row.spawnT) * SPEED_PX_PER_S) * dpr) / dpr;
        if (y < -FONT_PX || y > height + FONT_PX) continue;
        const x = PAD_X + Math.floor(row.lane * columns) * columnW;
        ctx.fillStyle = colors.ink;
        ctx.fillText(row.stamp, x, y);
        ctx.fillText(row.message, x + charW * (STAMP_COLS + TOPIC_COLS), y);
        ctx.fillStyle = colors.accent;
        ctx.fillText(row.topic, x + charW * STAMP_COLS, y);
      }
    };

    const step = (dt: number) => {
      t += dt;
      while (nextSpawnT <= t) {
        spawn(nextSpawnT);
        nextSpawnT += nextGap();
      }
      // Rows are in spawn order, so the ones that drifted off the top are at the front.
      const cutoff = visibleSince();
      let drop = 0;
      while (drop < rows.length && rows[drop].spawnT < cutoff) drop++;
      if (drop) rows = rows.slice(drop);
    };

    /* Animation loop */
    let rafId = 0;
    let lastTs = 0;
    const frame = (ts: number) => {
      rafId = requestAnimationFrame(frame);
      if (lastTs && ts - lastTs < FRAME_MS) return;
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, MAX_DT_S) : 0;
      lastTs = ts;
      step(dt);
      if ((t - drawnAtT) * SPEED_PX_PER_S * dpr >= 1) draw();
    };
    const start = () => {
      if (rafId) return;
      lastTs = 0;
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };
    const sync = () => {
      if (!ready || !mayAnimate || isStreamFrozen() || document.hidden) stop();
      else start();
    };

    /* Theme: a canvas can't use CSS variables, so re-read the tokens when the theme changes. */
    const onTheme = () => {
      colors = readColors();
      draw();
    };
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    darkQuery.addEventListener("change", onTheme);
    const themeObserver = new MutationObserver(onTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    /* Size from the canvas's real laid-out box, not the window. */
    const resizeObserver = new ResizeObserver((entries) => {
      const box = entries[entries.length - 1].contentRect;
      applySize(box.width, box.height);
    });
    resizeObserver.observe(canvas);

    /* devicePixelRatio changes (moving to another monitor, zoom) via a resolution query
       that is re-armed for the new ratio each time it fires. */
    let dprQuery: MediaQueryList | null = null;
    const watchDpr = () => {
      dprQuery?.removeEventListener("change", onDprChange);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprQuery.addEventListener("change", onDprChange);
    };
    function onDprChange() {
      watchDpr();
      applySize(width, height); // same CSS size, new backing-store resolution
    }
    watchDpr();
    document.addEventListener("visibilitychange", sync);
    const unsubscribeFrozen = subscribeStreamFrozen(sync);

    // First size and fill happen in the first ResizeObserver callback; motion waits
    // until the page has loaded and the browser is idle.
    const cancelIdle = whenLoadedAndIdle(() => {
      mayAnimate = true;
      sync();
    });

    // Redraw once the web font is ready so the first frame isn't stuck in a fallback font.
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive || !ready) return;
      setFont();
      draw();
    });

    return () => {
      alive = false;
      cancelIdle();
      stop();
      darkQuery.removeEventListener("change", onTheme);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      dprQuery?.removeEventListener("change", onDprChange);
      document.removeEventListener("visibilitychange", sync);
      unsubscribeFrozen();
    };
  }, [lines]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
