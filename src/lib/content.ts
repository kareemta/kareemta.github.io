/**
 * Content layer: zod schemas and build-time loaders for everything in `content/`.
 *
 * Server-only. These loaders read files with `fs` while `next build` runs (the site
 * is a static export), so only call them from server components or
 * `generateStaticParams`. Never import this file from a "use client" component.
 *
 * Any invalid file throws a ContentError naming the file and the bad fields, which
 * fails the build.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { formatRating, offsetLabel, reviewTopic, reviewTypes } from "@/lib/format";
import type { LogLine } from "@/lib/logLines";

const CONTENT_DIR = path.join(process.cwd(), "content");

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

/** Marker for content Kareem still has to fill in. */
export const TODO = "TODO(user)";
const todo = z.literal(TODO);

/** A format-checked string that may also be the literal `TODO(user)`. */
const orTodo = <T extends z.ZodType>(schema: T) => z.union([schema, todo]);

const nonEmpty = z.string().trim().min(1);

/** Calendar date, YYYY-MM-DD, that actually exists. */
const isoDate = z.iso.date();

/** Month precision for timelines: YYYY-MM. */
/** YYYY-MM, or a bare YYYY when only the year should be shown. */
const yearOrYearMonth = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "Expected YYYY or YYYY-MM");

/** Site-relative path to a file in `public/`, e.g. `/covers/dune.jpg`. */
const publicPath = (dir: string, ext: RegExp) =>
  z
    .string()
    .regex(
      new RegExp(`^/${dir}/[A-Za-z0-9._-]+$`),
      `Expected a path like /${dir}/file-name`,
    )
    .refine((p) => ext.test(p), "Unsupported file type")
    // Catch typos at build time: the file must actually exist under public/.
    .refine(
      (p) => fs.existsSync(path.join(process.cwd(), "public", p)),
      { error: (issue) => `File not found: public${String(issue.input)}` },
    );

const imagePath = (dir: string) => publicPath(dir, /\.(jpe?g|png|webp|avif)$/i);

const link = z.object({
  label: nonEmpty,
  url: orTodo(z.url()),
});

/**
 * Year as a number. 0 is allowed only on placeholder entries, because a number
 * field cannot hold the text TODO(user).
 */
const year = z.number().int().min(0).max(2100);

/**
 * `placeholder: true` marks seed entries that are not real yet. Their numeric
 * fields (rating, lat/lng, year) hold neutral zeros. Pages can show or skip them.
 */
const placeholder = z.boolean().optional();

/** Score out of 10, at most one decimal place (reviews and places). */
const rating = z
  .number()
  .min(0)
  .max(10)
  .refine(
    (r) => Math.abs(r * 10 - Math.round(r * 10)) < 1e-9,
    "Rating allows at most one decimal place (e.g. 8.5)",
  );

/** Checks `year` when present (it is optional for places). */
const requireRealYear = (
  entry: { placeholder?: boolean; year?: number },
  ctx: z.RefinementCtx,
) => {
  if (!entry.placeholder && entry.year !== undefined && entry.year < 1000) {
    ctx.addIssue({
      code: "custom",
      path: ["year"],
      message: "Year must be a real year (0 is only allowed with placeholder: true)",
    });
  }
};

const requireRealCoordinates = (
  entry: { placeholder?: boolean; lat: number; lng: number },
  ctx: z.RefinementCtx,
) => {
  if (!entry.placeholder && entry.lat === 0 && entry.lng === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["lat"],
      message: "lat/lng 0,0 is only allowed with placeholder: true",
    });
  }
};

/** Reports values that must be unique across a collection. */
const uniqueBy =
  <T>(key: (item: T) => string | number, label: string) =>
  (items: T[], ctx: z.RefinementCtx) => {
    const seen = new Map<string | number, number>();
    items.forEach((item, i) => {
      const k = key(item);
      if (seen.has(k)) {
        ctx.addIssue({
          code: "custom",
          path: [i],
          message: `Duplicate ${label} "${k}" (also used at index ${seen.get(k)})`,
        });
      } else {
        seen.set(k, i);
      }
    });
  };

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */

export const siteSchema = z.object({
  displayName: nonEmpty,
  headline: nonEmpty,
  tagline: nonEmpty,
  bio: z.array(nonEmpty).min(1),
  now: nonEmpty,
  location: nonEmpty.optional(),
  /**
   * Strict on purpose: no email field. SITE_SPEC.md section 8 keeps the email
   * private, and this repo is public, so an email here would leak via GitHub.
   */
  contact: z.strictObject({
    links: z.array(link),
  }),
});

export { reviewTypes } from "@/lib/format";

export const reviewSchema = z
  .object({
    /** Stable slug, e.g. "dune-1965". */
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Expected a lowercase slug"),
    /** Event number shown as `#0042`. */
    offset: z.number().int().min(1).max(9999),
    title: nonEmpty,
    type: z.enum(reviewTypes),
    /** Author, director or network. */
    creator: nonEmpty,
    /** Release / publication year. */
    year,
    /** Score out of 10, at most one decimal place. */
    rating,
    dateReviewed: orTodo(isoDate),
    /** 1–3 sentences. */
    take: nonEmpty.max(600, "Keep the take to 1–3 sentences (600 characters max)"),
    cover: imagePath("covers").optional(),
    isbn: z
      .string()
      .regex(/^(\d{9}[\dX]|\d{13})$/, "ISBN must be 10 or 13 digits, no dashes")
      .optional(),
    /** Currently reading / watching: pinned above the list on its type's page. */
    current: z.boolean().optional(),
    placeholder,
  })
  .superRefine(requireRealYear);

export const reviewsSchema = z
  .array(reviewSchema)
  .superRefine(uniqueBy((r) => r.id, "id"))
  .superRefine(uniqueBy((r) => r.offset, "offset"));

export const travelSchema = z
  .object({
    name: nonEmpty,
    country: nonEmpty,
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    /** Optional: when Kareem visited. */
    year: year.optional(),
    /** Optional score out of 10, at most one decimal place (same rules as reviews). */
    rating: rating.optional(),
    /** One line in Kareem's own words; shown exactly as written. */
    highlight: nonEmpty,
    photo: imagePath("travel").optional(),
    placeholder,
  })
  .superRefine(requireRealYear)
  .superRefine(requireRealCoordinates);

export const travelListSchema = z.array(travelSchema);

export const experienceEntrySchema = z
  .object({
    kind: z.enum(["work", "education"]),
    org: nonEmpty,
    title: nonEmpty,
    /** Optional: omit to show only the end date (e.g. "B.S. ... · 2024"). */
    start: orTodo(yearOrYearMonth).optional(),
    end: z.union([yearOrYearMonth, z.literal("present"), todo]),
    summary: z.array(nonEmpty),
    placeholder,
  })
  .superRefine((entry, ctx) => {
    // Same-precision dates compare correctly as text; mixed YYYY / YYYY-MM compare by
    // year. Skip a missing start, "present" and TODO values.
    const dated = (v: string | undefined): v is string => !!v && /^\d{4}(-\d{2})?$/.test(v);
    const { start, end } = entry;
    if (!dated(start) || !dated(end)) return;
    const after =
      start.length === end.length ? start > end : start.slice(0, 4) > end.slice(0, 4);
    if (after) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: `End (${entry.end}) is before start (${entry.start})`,
      });
    }
  });

export const experienceSchema = z.object({
  /** Served from public/resume.pdf. */
  resumePdf: z.literal("/resume.pdf").optional(),
  entries: z.array(experienceEntrySchema),
});

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Site = z.infer<typeof siteSchema>;
export type Link = z.infer<typeof link>;
export type { ReviewType } from "@/lib/format";
export type Review = z.infer<typeof reviewSchema>;
export type Place = z.infer<typeof travelSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type Experience = z.infer<typeof experienceSchema>;
/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

export class ContentError extends Error {
  constructor(file: string, details: string) {
    super(`Invalid content in content/${file}:\n${details}`);
    this.name = "ContentError";
  }
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const where = issue.path.length
        ? issue.path.map((p) => (typeof p === "number" ? `[${p}]` : `.${String(p)}`)).join("")
        : "(root)";
      return `  - ${where.replace(/^\./, "")}: ${issue.message}`;
    })
    .join("\n");
}

function readContentFile(file: string): string {
  const full = path.join(CONTENT_DIR, file);
  try {
    // Strip a UTF-8 byte-order mark, which some Windows editors add.
    return fs.readFileSync(full, "utf8").replace(/^\uFEFF/, "");
  } catch {
    throw new ContentError(file, "  - file is missing or unreadable");
  }
}

const cache = new Map<string, unknown>();
// In `npm run dev`, re-read files on every request so content edits show up
// without restarting the dev server.
const useCache = process.env.NODE_ENV !== "development";

function loadJson<T extends z.ZodType>(file: string, schema: T): z.infer<T> {
  if (useCache && cache.has(file)) return cache.get(file) as z.infer<T>;

  let raw: unknown;
  try {
    raw = JSON.parse(readContentFile(file));
  } catch (err) {
    if (err instanceof ContentError) throw err;
    throw new ContentError(file, `  - not valid JSON: ${(err as Error).message}`);
  }

  const result = schema.safeParse(raw);
  if (!result.success) throw new ContentError(file, formatIssues(result.error));

  if (useCache) cache.set(file, result.data);
  return result.data;
}

export function getSite(): Site {
  return loadJson("site.json", siteSchema);
}

export function getReviews(): Review[] {
  return loadJson("reviews.json", reviewsSchema);
}

export function getTravel(): Place[] {
  return loadJson("travel.json", travelListSchema);
}

export function getExperience(): Experience {
  return loadJson("experience.json", experienceSchema);
}

/**
 * Site path of the resume PDF, or null if the file isn't in public/ yet. Checked
 * at build time so the page never renders a broken download link.
 */
export function getResumeUrl(): string | null {
  const url = getExperience().resumePdf ?? "/resume.pdf";
  return fs.existsSync(path.join(process.cwd(), "public", url)) ? url : null;
}

/** Sort key for an entry's end: "present" sorts after every real month. */
/** Sort key: "present" sorts last-in-time; a bare year sorts as December of that year. */
const endKey = (end: ExperienceEntry["end"]) =>
  end === "present" ? "9999-12" : end.length === 4 ? `${end}-12` : end;

/** Real (non-placeholder) experience entries, most recent first. */
export function getExperienceEntries(): ExperienceEntry[] {
  return [...publishable(getExperience().entries)].sort(
    (a, b) => endKey(b.end).localeCompare(endKey(a.end)) || (b.start ?? "").localeCompare(a.start ?? ""),
  );
}

/**
 * Loads and checks every content file. The root layout calls this, so any invalid
 * file fails `next build` even before a page uses that collection.
 */
export function validateAllContent(): void {
  getSite();
  getReviews();
  getTravel();
  getExperience();
}

/* ------------------------------------------------------------------ */
/* Log stream                                                          */
/* ------------------------------------------------------------------ */

/** True if any field of a content entry still holds TODO(user). */
function hasTodo(entry: unknown): boolean {
  return JSON.stringify(entry).includes(TODO);
}

/**
 * Entries that are safe to show publicly: not a placeholder and no TODO(user)
 * anywhere. Use this wherever content is surfaced outside its own page.
 */
export function publishable<T extends { placeholder?: boolean }>(items: T[]): T[] {
  return items.filter((item) => !item.placeholder && !hasTodo(item));
}


/**
 * Real-content lines for the background <LogStream>, e.g.
 * `review.book  #0042 "Dune" · Frank Herbert · 9.0/10`. Placeholder and
 * TODO(user) entries are skipped so no made-up facts ever appear.
 */
export function getContentLogLines(): LogLine[] {
  const real = publishable;

  return [
    ...real(getReviews()).map((r) => ({
      topic: reviewTopic(r.type),
      message: `${offsetLabel(r.offset)} "${r.title}" · ${r.creator} · ${formatRating(r.rating)}/10`,
    })),
    ...real(getTravel()).map((p) => ({
      topic: "travel.visited",
      message: [
        `${p.name}, ${p.country}`,
        p.rating !== undefined ? `${formatRating(p.rating)}/10` : null,
        p.year,
      ]
        .filter((part) => part !== null && part !== undefined)
        .join(" · "),
    })),
  ];
}

