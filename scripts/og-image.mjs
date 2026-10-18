/**
 * Generates the committed social/preview images (run by hand when the design or
 * identity changes; not part of `next build`):
 *   public/og.png          1200x630 Open Graph / Twitter card (dark theme tokens)
 *   src/app/apple-icon.png 180x180 home-screen icon (the `k/` mark)
 *
 * Usage: node scripts/og-image.mjs
 * Needs network once for Google Fonts (Bricolage Grotesque, JetBrains Mono).
 * Name and headline come from content/site.json; log lines are generic texture.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "site.json"), "utf8"));
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Dark theme tokens from src/app/globals.css.
const T = { bg: "#0d1117", ink: "#e6eaf0", muted: "#8b95a5", line: "#2a313c", accent: "#7c9bff" };

// Only as many lines as fit above the name (it starts around y=400).
const LOG = [
  ["consumer.lag", "group=site-feed partition=3 lag=12"],
  ["checkpoint.committed", "topic=events offset=48211"],
  ["partition.rebalance", "group=indexer assigned=6 gen=118"],
  ["batch.flushed", "records=512 bytes=96KiB"],
  ["watermark.advanced", "topic=travel delay=240ms"],
  ["heartbeat", "group=notifier status=ok"],
  ["schema.validated", "topic=reviews version=4 ok"],
];
const logHtml = LOG.map(
  ([topic, msg], i) =>
    `<div><span>12:04:${String(10 + i * 3).padStart(2, "0")}.${String(100 + i * 37).slice(-3)}</span><b>${topic}</b>${msg}</div>`,
).join("");

const ogHtml = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=JetBrains+Mono:wght@400;700&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: ${T.bg}; color: ${T.ink}; overflow: hidden; position: relative; font-family: "JetBrains Mono", monospace; }
  /* Log texture: top-right only, well clear of the name; starts inside the frame
     (no cut-off timestamps) and fades out toward the right edge. */
  .log { position: absolute; top: 44px; left: 560px; right: 0; font-size: 18px; line-height: 2.05; color: ${T.ink}; opacity: 0.16;
         white-space: nowrap; overflow: hidden; -webkit-mask-image: linear-gradient(to right, #000 70%, transparent); }
  .log span { margin-right: 22px; } .log b { font-weight: 400; color: ${T.accent}; margin-right: 22px; }
  .card { position: absolute; left: 72px; top: 64px; bottom: 64px; display: flex; flex-direction: column; justify-content: space-between; }
  .mark { font-size: 34px; font-weight: 700; } .mark i { font-style: normal; color: ${T.accent}; }
  h1 { font-family: "Bricolage Grotesque", sans-serif; font-size: 100px; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; }
  .role { margin-top: 28px; font-size: 32px; color: ${T.accent}; }
  .rule { position: absolute; left: 0; right: 0; bottom: 0; height: 8px; background: ${T.accent}; }
</style></head><body>
  <div class="log" aria-hidden="true">${logHtml}</div>
  <div class="card">
    <div class="mark">kareem<i>/</i></div>
    <div><h1>${esc(site.displayName)}</h1><div class="role">${esc(site.headline)}</div></div>
  </div>
  <div class="rule"></div>
</body></html>`;

// Apple icon: same `k/` strokes as src/app/icon.svg, light accent version, no rounding (iOS masks it).
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="180" height="180">
  <rect width="32" height="32" fill="#2f5bea"/>
  <g fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(3.2 3.2) scale(0.8)">
    <path d="M8.5 7.5v17"/><path d="M17 12.5l-8.5 7"/><path d="M12.2 17.4l5.3 7.1"/><path d="M26 7.5l-5.5 17"/>
  </g></svg>`;

const browser = await chromium.launch();
try {
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(ogHtml, { waitUntil: "networkidle" });
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: path.join(ROOT, "public", "og.png") });

  const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await icon.setContent(`<body style="margin:0">${appleSvg}</body>`);
  await icon.screenshot({ path: path.join(ROOT, "src", "app", "apple-icon.png") });
  console.log("wrote public/og.png and src/app/apple-icon.png");
} finally {
  await browser.close();
}
