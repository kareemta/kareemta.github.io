#!/usr/bin/env node
/**
 * Review screenshots: serves the static build in out/ and takes full-page
 * screenshots of every route at phone and desktop widths, in light and dark.
 *
 * Usage: npm run build && npm run shots
 * Output: ../.shots/<route-slug>__<width>__<theme>.png (outside the git repo)
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(REPO_DIR, "out");
const SHOTS_DIR = path.resolve(REPO_DIR, "..", ".shots");

const WIDTHS = [390, 1280];
const THEMES = /** @type {const} */ (["light", "dark"]);
const VIEWPORT_HEIGHT = 900;
const NAV_TIMEOUT_MS = 30_000;

/**
 * localStorage key used by <ThemeToggle> (must match THEME_STORAGE_KEY in
 * src/lib/theme.ts). Each screenshot forces the stored theme as well as the OS
 * color scheme, so a manual choice cannot leak between shots.
 */
const THEME_STORAGE_KEY = "theme";

/** Route used to capture the 404 page; any path that does not exist works. */
const NOT_FOUND_PATH = "/__shots-not-found__/";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};

/* ------------------------------------------------------------------ */
/* Static server for out/                                              */
/* ------------------------------------------------------------------ */

/** Maps a URL path to a file inside out/, or null if there is none. */
function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  const target = path.resolve(OUT_DIR, "." + path.posix.normalize("/" + decoded));
  // Path traversal guard: the file must stay inside out/.
  if (target !== OUT_DIR && !target.startsWith(OUT_DIR + path.sep)) return null;

  const candidates = decoded.endsWith("/")
    ? [path.join(target, "index.html")]
    : [target, path.join(target, "index.html")];
  return candidates.find((f) => fs.existsSync(f) && fs.statSync(f).isFile()) ?? null;
}

function startServer() {
  const notFoundPage = path.join(OUT_DIR, "404.html");

  const server = http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }
    const urlPath = new URL(req.url ?? "/", "http://localhost").pathname;
    const file = resolveFile(urlPath);
    const status = file ? 200 : 404;
    const body = file ?? (fs.existsSync(notFoundPage) ? notFoundPage : null);

    if (!body) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const type =
      CONTENT_TYPES[path.extname(body).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(body).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    // Port 0 = the OS picks a random free port.
    server.listen(0, "127.0.0.1", () => {
      const { port } = /** @type {import("node:net").AddressInfo} */ (server.address());
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

const SKIP_DIRS = new Set(["_next", "_not-found", "404"]);

/** Finds every index.html in out/ and returns its route, e.g. "/about/". */
async function discoverRoutes(dir = OUT_DIR, prefix = "/") {
  const routes = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name === "index.html") routes.push(prefix);
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
      routes.push(
        ...(await discoverRoutes(path.join(dir, entry.name), `${prefix}${entry.name}/`)),
      );
    }
  }
  return routes;
}

function slugFor(route) {
  if (route === "/") return "home";
  if (route === NOT_FOUND_PATH) return "404";
  return route.replace(/^\/|\/$/g, "").replaceAll("/", "-");
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  if (!fs.existsSync(path.join(OUT_DIR, "index.html"))) {
    console.error("No build found in out/. Run `npm run build` first, then `npm run shots`.");
    return 1;
  }

  // Launch the browser first: if it fails, nothing has been started or deleted yet.
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.error(
      "Could not start Chromium. If it is not installed yet, run this once:\n" +
        "  npx playwright install chromium\n\n" +
        `Details: ${err instanceof Error ? err.message.split("\n")[0] : err}`,
    );
    return 1;
  }

  /** @type {http.Server | undefined} */
  let server;
  let failures = 0;
  let count = 0;

  try {
    // Clear old screenshots only once the browser is known to work.
    await fsp.mkdir(SHOTS_DIR, { recursive: true });
    for (const name of await fsp.readdir(SHOTS_DIR)) {
      if (name.endsWith(".png")) await fsp.rm(path.join(SHOTS_DIR, name));
    }

    const routes = [...(await discoverRoutes()).sort(), NOT_FOUND_PATH];
    const started = await startServer();
    server = started.server;
    const { origin } = started;

    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width, height: VIEWPORT_HEIGHT },
          colorScheme: theme,
          reducedMotion: "reduce",
        });
        if (THEME_STORAGE_KEY) {
          await context.addInitScript(
            ([key, value]) => {
              try {
                localStorage.setItem(key, value);
              } catch {
                /* storage unavailable: fall back to colorScheme */
              }
            },
            [THEME_STORAGE_KEY, theme],
          );
        }
        const page = await context.newPage();
        page.setDefaultTimeout(NAV_TIMEOUT_MS);

        for (const route of routes) {
          const file = `${slugFor(route)}__${width}__${theme}.png`;
          try {
            const response = await page.goto(origin + route, { waitUntil: "load" });
            const expected = route === NOT_FOUND_PATH ? 404 : 200;
            if (response?.status() !== expected) {
              throw new Error(`expected HTTP ${expected}, got ${response?.status()}`);
            }
            await page.evaluate(() => document.fonts.ready);
            await page.screenshot({ path: path.join(SHOTS_DIR, file), fullPage: true });
            count++;
            console.log(`  ok  ${file}`);
          } catch (err) {
            failures++;
            console.error(`  FAIL ${file}: ${err instanceof Error ? err.message : err}`);
          }
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\n${count} screenshot(s) written to ${SHOTS_DIR}`);
  if (failures) {
    console.error(`${failures} screenshot(s) failed.`);
    return 1;
  }
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(err);
    process.exitCode = 1;
  },
);
