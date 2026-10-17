/**
 * Shared "is the log stream paused?" state.
 *
 * The state lives on <html> as data-stream="paused" (absent = running), so any
 * component can read it without a React context, and CSS can react to it too.
 * The footer's <PauseStream> button writes it; <LogStream> (task 2.3) reads it
 * with isStreamPaused() and subscribeStream(). The choice is remembered in
 * localStorage and re-applied before first paint by streamInitScript, so a
 * visitor who paused the stream never sees it start moving on the next page.
 *
 * Under prefers-reduced-motion the stream is frozen regardless of this flag;
 * isStreamFrozen() / subscribeStreamFrozen() combine the two for <LogStream>.
 */
export const STREAM_STORAGE_KEY = "stream";
export const STREAM_ATTRIBUTE = "data-stream";
const PAUSED = "paused";

export function isStreamPaused(): boolean {
  return document.documentElement.getAttribute(STREAM_ATTRIBUTE) === PAUSED;
}

export function setStreamPaused(paused: boolean): void {
  const root = document.documentElement;
  if (paused) root.setAttribute(STREAM_ATTRIBUTE, PAUSED);
  else root.removeAttribute(STREAM_ATTRIBUTE);
  try {
    if (paused) localStorage.setItem(STREAM_STORAGE_KEY, PAUSED);
    else localStorage.removeItem(STREAM_STORAGE_KEY);
  } catch {
    // Storage unavailable: the choice lasts for this page only.
  }
}

/** Calls onChange whenever the paused state changes. Returns an unsubscribe function. */
export function subscribeStream(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [STREAM_ATTRIBUTE],
  });
  return () => observer.disconnect();
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the stream must not move: paused by the visitor, or reduced motion is on. */
export function isStreamFrozen(): boolean {
  return isStreamPaused() || window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Like subscribeStream, but also fires when the reduced-motion setting changes. */
export function subscribeStreamFrozen(onChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  const unsubscribe = subscribeStream(onChange);
  return () => {
    media.removeEventListener("change", onChange);
    unsubscribe();
  };
}

/** Inline <head> script: restore a stored pause before first paint. Plain ES5. */
export const streamInitScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  STREAM_STORAGE_KEY,
)})===${JSON.stringify(PAUSED)})document.documentElement.setAttribute(${JSON.stringify(
  STREAM_ATTRIBUTE,
)},${JSON.stringify(PAUSED)})}catch(e){}})()`;
