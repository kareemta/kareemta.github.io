"use client";

/**
 * Monochrome travel globe (SITE_SPEC.md "Travel globe: monochrome"). Loaded only
 * on /travel via next/dynamic with ssr: false, so three.js never reaches the
 * static HTML or any other route's bundle.
 *
 * - Sphere and land are unlit MeshBasicMaterials in --globe-sphere / --globe-land:
 *   flat fills, no outlines, no atmosphere, no lights. Re-read on theme change.
 * - Land: Natural Earth 1:110m land polygons, bundled at /geo/ne_110m_land.json
 *   (public domain; see public/geo/ne_110m_land.LICENSE.txt).
 * - Pins are DOM elements (CSS-styled dots with a pulse ring), so they follow the
 *   theme tokens directly and the pulse stops under reduced motion via CSS.
 * - Slow auto-rotate, stopped by any interaction or a list selection, and off
 *   under reduced motion. Zoom is disabled; on touch screens vertical swipes still
 *   scroll the page (touch-action: pan-y).
 * - Rendering pauses when the tab is hidden or the globe is scrolled offscreen.
 *   Pixel ratio is capped at 2 by the library (three-render-objects).
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { MeshBasicMaterial, type WebGLRenderer } from "three";
import type { Place } from "@/lib/content";
import { readToken, subscribeTheme } from "@/lib/themeWatch";
import styles from "./TravelGlobe.module.css";

const LAND_URL = "/geo/ne_110m_land.json";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const MAX_HEIGHT = 560;
const DEFAULT_POV = { lat: 20, lng: 10, altitude: 1.9 };
const FOCUS_ALTITUDE = 1.7; // for places with no close neighbours
const MIN_ALTITUDE = 0.035;
/**
 * Close places (Nice and Monaco, Naples and Amalfi...) overlap at full-globe zoom.
 * When one is selected, fly in until its nearest neighbour is about PIN_GAP_PX away
 * on screen. At this camera (50 deg fov, square ~560px canvas) one degree of arc
 * spans roughly 10.5 / altitude px, so altitude = gap_deg * 10.5 / PIN_GAP_PX. The
 * scale follows the canvas height (vertical fov), so phones zoom in further.
 */
const PIN_GAP_PX = 24;
const PX_PER_DEG_AT_ALT_1 = 10.5;
const REFERENCE_HEIGHT_PX = 560;

/** Great-circle distance between two points, in degrees of arc. */
function arcDegrees(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return (2 * Math.asin(Math.min(1, Math.sqrt(h)))) / rad;
}
const FLY_MS = 900;

type LandFeature = { type: "Feature"; geometry: { type: string; coordinates: number[] } };
type Pin = { index: number; lat: number; lng: number; label: string };
type Controls = ReturnType<GlobeMethods["controls"]>;

/** "sphere|land" from the tokens; a string so useSyncExternalStore can compare it. */
const readColors = () => `${readToken("--globe-sphere")}|${readToken("--globe-land")}`;
const serverColors = () => "#000000|#ffffff";

const subscribeMotion = (onChange: () => void) => {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

type TravelGlobeProps = {
  places: Place[];
  selected: number | null;
  onSelect: (index: number) => void;
};

export default function TravelGlobe({ places, selected, onSelect }: TravelGlobeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const pinEls = useRef(new Map<number, HTMLElement>());
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  /* Captured at setup so the unmount cleanup can release them. */
  const teardown = useRef<{ renderer: WebGLRenderer; controls: Controls; onStart: () => void } | null>(
    null,
  );
  const [width, setWidth] = useState(0);
  const [land, setLand] = useState<LandFeature[]>([]);
  const [ready, setReady] = useState(false);

  const colors = useSyncExternalStore(subscribeTheme, readColors, serverColors);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readReducedMotion, () => true);

  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedRef.current = selected;
  }, [onSelect, selected]);

  /* Flat, unlit materials from the tokens; rebuilt (and the old ones freed) on theme change. */
  const [sphereColor, landColor] = colors.split("|");
  const sphereMaterial = useMemo(() => new MeshBasicMaterial({ color: sphereColor }), [sphereColor]);
  const landMaterial = useMemo(() => new MeshBasicMaterial({ color: landColor }), [landColor]);
  useEffect(() => () => sphereMaterial.dispose(), [sphereMaterial]);
  useEffect(() => () => landMaterial.dispose(), [landMaterial]);

  /* Land polygons, from this site (never a CDN). */
  useEffect(() => {
    let alive = true;
    fetch(LAND_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { features: LandFeature[] }) => {
        if (alive) setLand(data.features);
      })
      .catch(() => {
        // Without land the globe is a plain sphere with pins; the list still works.
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Size from the container; square up to MAX_HEIGHT. */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w >= 2) setWidth(w);
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  /* One-time setup once the globe exists: controls, camera, touch behavior. */
  const handleReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotateSpeed = 0.35;
    const onStart = () => {
      controls.autoRotate = false; // any drag stops the rotation for good
    };
    controls.addEventListener("start", onStart);
    globe.pointOfView(DEFAULT_POV, 0);
    const renderer = globe.renderer();
    // OrbitControls sets touch-action: none; let vertical swipes scroll the page.
    renderer.domElement.style.touchAction = "pan-y";
    teardown.current = { renderer, controls, onStart };
    setReady(true);
  }, []);

  /*
   * Release the WebGL context on unmount. The library disposes the renderer but
   * keeps the context, so leaving /travel repeatedly would pile up contexts until
   * the browser warns ("Too many active WebGL contexts"). The release is deferred
   * one task and skipped while our wrapper is still in the document: React's
   * dev-mode unmount/remount check keeps the same DOM, a real unmount removes it.
   */
  useEffect(() => {
    const wrap = wrapRef.current;
    return () => {
      const parts = teardown.current;
      setTimeout(() => {
        if (!parts || wrap?.isConnected) return;
        parts.controls.removeEventListener("start", parts.onStart);
        parts.renderer.forceContextLoss();
        parts.renderer.domElement.remove();
        teardown.current = null;
      }, 0);
    };
  }, []);

  /* Auto-rotate only while motion is allowed and nothing has been selected. */
  useEffect(() => {
    const globe = globeRef.current;
    if (!ready || !globe) return;
    globe.controls().autoRotate = !reducedMotion && selected === null;
  }, [ready, reducedMotion, selected]);

  /* Per-place zoom: close enough that the nearest other place is a distinct pin. */
  const focusAltitudes = useMemo(
    () =>
      places.map((p, i) => {
        let nearest = Infinity;
        places.forEach((q, j) => {
          if (j !== i) nearest = Math.min(nearest, arcDegrees(p, q));
        });
        const scale = Math.min(width, MAX_HEIGHT) / REFERENCE_HEIGHT_PX || 1;
        const alt = (nearest * PX_PER_DEG_AT_ALT_1 * scale) / PIN_GAP_PX;
        return Math.min(FOCUS_ALTITUDE, Math.max(MIN_ALTITUDE, alt));
      }),
    [places, width],
  );

  /* Fly to the selected place. */
  useEffect(() => {
    const globe = globeRef.current;
    if (!ready || !globe || selected === null) return;
    const place = places[selected];
    if (!place) return;
    globe.controls().autoRotate = false;
    globe.pointOfView(
      { lat: place.lat, lng: place.lng, altitude: focusAltitudes[selected] ?? FOCUS_ALTITUDE },
      reducedMotion ? 0 : FLY_MS,
    );
  }, [ready, selected, places, focusAltitudes, reducedMotion]);

  /** Back to the whole-globe view, centred on the current spot. */
  const zoomOut = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const { lat, lng } = globe.pointOfView();
    globe.pointOfView({ lat, lng, altitude: DEFAULT_POV.altitude }, reducedMotion ? 0 : FLY_MS);
  }, [reducedMotion]);

  /* Pause rendering when the tab is hidden or the globe is offscreen. */
  useEffect(() => {
    const wrap = wrapRef.current;
    const globe = globeRef.current;
    if (!ready || !wrap || !globe) return;
    let onScreen = true;
    const sync = () => {
      if (onScreen && !document.hidden) globe.resumeAnimation();
      else globe.pauseAnimation();
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(wrap);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ready]);

  /* Mark the selected pin. */
  useEffect(() => {
    pinEls.current.forEach((el, index) => {
      el.toggleAttribute("data-selected", index === selected);
    });
  }, [selected]);

  const pins: Pin[] = useMemo(
    () =>
      places.map((p, index) => ({ index, lat: p.lat, lng: p.lng, label: `${p.name}, ${p.country}` })),
    [places],
  );

  /* Pin elements: decorative for assistive tech (the list below is the accessible path). */
  const makePin = useCallback((d: object) => {
    const pin = d as Pin;
    const el = document.createElement("div");
    el.className = styles.pin;
    el.setAttribute("aria-hidden", "true");
    el.title = pin.label;
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      onSelectRef.current(pin.index);
    });
    el.toggleAttribute("data-selected", pin.index === selectedRef.current);
    pinEls.current.set(pin.index, el);
    return el;
  }, []);

  const height = Math.min(width, MAX_HEIGHT);

  return (
    <div className={styles.stage}>
      {/* Decorative for assistive tech: the list and detail panel carry the same content. */}
      <div ref={wrapRef} className={styles.wrap} aria-hidden="true">
        {width > 0 && (
          <Globe
            ref={globeRef}
            width={width}
            height={height}
            backgroundColor="rgba(0,0,0,0)"
            globeMaterial={sphereMaterial}
            showAtmosphere={false}
            showGraticules={false}
            animateIn={false}
            onGlobeReady={handleReady}
            polygonsData={land}
            polygonCapMaterial={() => landMaterial}
            polygonSideColor={() => "rgba(0,0,0,0)"}
            polygonStrokeColor={() => false}
            polygonAltitude={0.006}
            polygonsTransitionDuration={0}
            htmlElementsData={pins}
            htmlLat="lat"
            htmlLng="lng"
            htmlAltitude={0.01}
            htmlElement={makePin}
            htmlTransitionDuration={0}
          />
        )}
      </div>
      {ready && selected !== null && (
        <button type="button" className={styles.zoomOut} onClick={zoomOut}>
          Show whole globe
        </button>
      )}
    </div>
  );
}
