"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import type { Place } from "@/lib/content";
import { formatRating } from "@/lib/format";
import styles from "./TravelExplorer.module.css";

// three.js + react-globe.gl: browser-only and heavy, so loaded on demand.
const TravelGlobe = dynamic(() => import("@/components/TravelGlobe/TravelGlobe"), {
  ssr: false,
  loading: () => <div className={styles.globeLoading} aria-hidden="true" />,
});

let webglSupport: boolean | undefined;
/** Checked once per page load, in the browser only. */
function hasWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      webglSupport = gl !== null;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}
const noSubscribe = () => () => {};

/** "Lisbon, Portugal, rated 8.5 out of 10, 2024" (rating and year only when present). */
function placeSummary(p: Place): string {
  return [
    `${p.name}, ${p.country}`,
    p.rating !== undefined ? `rated ${formatRating(p.rating)} out of 10` : null,
    p.year !== undefined ? String(p.year) : null,
  ]
    .filter(Boolean)
    .join(", ");
}

/** Rating shown as "8.5/10", read by screen readers as "rated 8.5 out of 10". */
function Rating({ value }: { value: number }) {
  const r = formatRating(value);
  return (
    <>
      <span aria-hidden="true">{r}/10</span>
      <span className="visually-hidden">rated {r} out of 10</span>
    </>
  );
}

/**
 * Globe plus the accessible list of places. The list is the keyboard and
 * screen-reader path; choosing a place there (or clicking its pin) flies the
 * globe to it and shows its details in the panel, which is ordinary DOM.
 */
export default function TravelExplorer({ places }: { places: Place[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  // null during the static build and first paint, then true/false in the browser.
  const webgl = useSyncExternalStore(noSubscribe, hasWebGL, () => null);
  const select = useCallback((index: number) => setSelected(index), []);
  const stageRef = useRef<HTMLDivElement>(null);

  /** List choice: select, and bring the globe and details into view if they're off-screen. */
  const chooseFromList = (index: number) => {
    setSelected(index);
    const stage = stageRef.current;
    if (!stage) return;
    const { top, bottom } = stage.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      stage.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };
  const place = selected === null ? null : places[selected];

  return (
    <div className={styles.explorer}>
      <div ref={stageRef} className={styles.stage}>
        {webgl === false ? (
          <p className={styles.fallback}>
            The interactive globe needs WebGL, which isn&apos;t available in this browser. All
            places are listed below.
          </p>
        ) : webgl ? (
          <TravelGlobe places={places} selected={selected} onSelect={select} />
        ) : (
          <div className={styles.globeLoading} aria-hidden="true" />
        )}

        {/* Short announcement for screen readers; the panel below holds the details. */}
        <p className="visually-hidden" role="status" aria-live="polite">
          {place ? `Showing ${placeSummary(place)}` : ""}
        </p>

        <section className={styles.detail} aria-labelledby="place-heading">
          {place ? (
            <>
              <p className={styles.topic} aria-hidden="true">
                travel.visited
                {place.rating !== undefined ? ` · ${formatRating(place.rating)}/10` : ""}
                {place.year !== undefined ? ` · ${place.year}` : ""}
              </p>
              <h2 id="place-heading" className={styles.placeName}>
                {place.name}
              </h2>
              <p className={styles.placeMeta}>
                {place.country}
                {place.rating !== undefined && (
                  <>
                    {" · "}
                    <Rating value={place.rating} />
                  </>
                )}
                {place.year !== undefined && ` · ${place.year}`}
              </p>
              <p className={styles.highlight}>{place.highlight}</p>
              {place.photo && (
                <div className={styles.photo}>
                  <Image
                    src={place.photo}
                    alt={`Photo from ${place.name}`}
                    fill
                    sizes="(max-width: 48rem) 100vw, 22rem"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <h2 id="place-heading" className={styles.placeName}>
                Pick a place
              </h2>
              <p className={styles.hint}>
                Choose a place from the list{webgl ? " or tap a pin on the globe" : ""} to see
                its score and what stood out.
              </p>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="places-heading">
        <h2 id="places-heading" className={styles.listHeading}>
          Places <span className={styles.count}>({places.length})</span>
        </h2>
        <ul className={styles.list}>
          {places.map((p, index) => (
            <li key={`${p.name}-${p.country}`}>
              <button
                type="button"
                className={styles.item}
                aria-pressed={selected === index}
                onClick={() => chooseFromList(index)}
              >
                <span className={styles.itemName}>
                  {p.name}, {p.country}
                </span>
                {p.rating !== undefined ? (
                  <span className={styles.itemMeta}>
                    <Rating value={p.rating} />
                  </span>
                ) : p.year !== undefined ? (
                  <span className={styles.itemMeta}>{p.year}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
