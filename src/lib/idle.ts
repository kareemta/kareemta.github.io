/**
 * Run `task` once the page has finished loading and the browser is idle, so
 * decorative work (log stream, globe) never competes with the first render.
 * Client-only. Returns a cancel function.
 */
export function whenLoadedAndIdle(task: () => void, timeoutMs = 2000): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timerId: number | undefined;

  const schedule = () => {
    if (cancelled) return;
    // Typed as always present, but Safari lacks it: check at runtime.
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => !cancelled && task(), { timeout: timeoutMs });
    } else {
      // Safari has no requestIdleCallback: a short delay after load is close enough.
      timerId = globalThis.setTimeout(() => !cancelled && task(), 300) as unknown as number;
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timerId !== undefined) globalThis.clearTimeout(timerId);
  };
}
