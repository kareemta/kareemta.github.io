/**
 * Post-build fix for client-side navigation payloads in the static export.
 *
 * When prefetching /books/, the Next router requests
 *   /books/__next.books.__PAGE__.txt
 * but `output: "export"` writes that payload as
 *   /books/__next.books/__PAGE__.txt
 * (the root page already gets the dotted form). GitHub Pages can't rewrite URLs,
 * so the requests 404 and the router falls back to a full page load.
 *
 * This copies every file under an `__next.<segment>/` folder to the dotted
 * sibling name the router asks for. Runs automatically after `next build`
 * (see the "build" script in package.json), so CI does it too.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");

let copied = 0;

/** Every file under `dir`, as paths relative to it. */
function filesUnder(dir, prefix = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? filesUnder(path.join(dir, entry.name), rel) : [rel];
  });
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith("__next.")) {
      for (const rel of filesUnder(full)) {
        const target = path.join(dir, `${entry.name}.${rel.replaceAll("/", ".")}`);
        if (!fs.existsSync(target)) {
          fs.copyFileSync(path.join(full, rel), target);
          copied++;
        }
      }
    } else if (entry.name !== "_next") {
      walk(full);
    }
  }
}

if (!fs.existsSync(OUT)) {
  console.error("fix-rsc-paths: out/ not found; run next build first");
  process.exit(1);
}
walk(OUT);
console.log(`fix-rsc-paths: added ${copied} dotted payload file(s)`);
