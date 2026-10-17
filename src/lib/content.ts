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
import { formatRating, offsetLabel, reviewTypes } from "@/lib/format";
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
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");

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

const requireRealYear = (
  entry: { placeholder?: boolean; year: number },
  ctx: z.RefinementCtx,
) => {
  if (!entry.placeholder && entry.year < 1000) {
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
  contact: z.object({
    email: orTodo(z.email()).optional(),
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
    rating: z
      .number()
      .min(0)
      .max(10)
      .refine(
        (r) => Math.abs(r * 10 - Math.round(r * 10)) < 1e-9,
        "Rating allows at most one decimal place (e.g. 8.5)",
      ),
    dateReviewed: orTodo(isoDate),
    /** 1–3 sentences. */
    take: nonEmpty.max(600, "Keep the take to 1–3 sentences (600 characters max)"),
    cover: imagePath("covers").optional(),
    isbn: z
      .string()
      .regex(/^(\d{9}[\dX]|\d{13})$/, "ISBN must be 10 or 13 digits, no dashes")
      .optional(),
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
    year,
    highlight: nonEmpty,
    photo: imagePath("travel").optional(),
    placeholder,
  })
  .superRefine(requireRealYear)
  .superRefine(requireRealCoordinates);

export const travelListSchema = z.array(travelSchema);

export const projectSchema = z.object({
  name: nonEmpty,
  oneLiner: nonEmpty,
  tech: z.array(nonEmpty),
  links: z.array(link),
  placeholder,
});

export const projectsSchema = z
  .array(projectSchema)
  .superRefine(uniqueBy((p) => p.name, "project name"));

export const experienceEntrySchema = z.object({
  kind: z.enum(["work", "education"]),
  org: nonEmpty,
  title: nonEmpty,
  start: orTodo(yearMonth),
  end: z.union([yearMonth, z.literal("present"), todo]),
  summary: z.array(nonEmpty),
  placeholder,
});

export const experienceSchema = z.object({
  /** Served from public/resume.pdf. */
  resumePdf: z.literal("/resume.pdf").optional(),
  entries: z.array(experienceEntrySchema),
});

export const postMetaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Expected a lowercase slug"),
  title: nonEmpty,
  date: orTodo(isoDate),
  summary: nonEmpty,
  draft: z.boolean().optional(),
  placeholder,
});

export const postIndexSchema = z
  .array(postMetaSchema)
  .superRefine(uniqueBy((p) => p.slug, "slug"));

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Site = z.infer<typeof siteSchema>;
export type Link = z.infer<typeof link>;
export type { ReviewType } from "@/lib/format";
export type Review = z.infer<typeof reviewSchema>;
export type Place = z.infer<typeof travelSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type PostMeta = z.infer<typeof postMetaSchema>;
export type Post = PostMeta & { /** Raw markdown body. Rendering comes later. */ body: string };

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

export function getProjects(): Project[] {
  return loadJson("projects.json", projectsSchema);
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
const endKey = (end: ExperienceEntry["end"]) => (end === "present" ? "9999-12" : end);

/** Real (non-placeholder) experience entries, most recent first. */
export function getExperienceEntries(): ExperienceEntry[] {
  return publishable(getExperience().entries).toSorted(
    (a, b) => endKey(b.end).localeCompare(endKey(a.end)) || b.start.localeCompare(a.start),
  );
}

const POSTS_INDEX = "posts/index.json";

/** Loads posts/index.json and checks it matches the .md files one-to-one. */
function getPostIndex(): PostMeta[] {
  const index = loadJson(POSTS_INDEX, postIndexSchema);

  const postsDir = path.join(CONTENT_DIR, "posts");
  const files = new Set(
    fs.readdirSync(postsDir).filter((f) => f.toLowerCase().endsWith(".md")),
  );
  const problems: string[] = [];

  for (const { slug } of index) {
    if (!files.has(`${slug}.md`)) {
      problems.push(`  - "${slug}" has no matching file content/posts/${slug}.md`);
    }
  }
  const slugs = new Set(index.map((p) => p.slug));
  for (const file of files) {
    if (!slugs.has(file.replace(/\.md$/i, ""))) {
      problems.push(`  - content/posts/${file} is not listed in ${POSTS_INDEX}`);
    }
  }
  if (problems.length) throw new ContentError(POSTS_INDEX, problems.join("\n"));

  return index;
}

/** Sort comparator for ISO dates, newest first, with `TODO(user)` dates last. */
export function compareDatesNewestFirst(a: string, b: string): number {
  if (a === TODO || b === TODO) return Number(a === TODO) - Number(b === TODO);
  return b.localeCompare(a);
}

/** Post metadata, newest first. Drafts are left out unless asked for. */
export function getPosts({ includeDrafts = false } = {}): PostMeta[] {
  return getPostIndex()
    .filter((p) => includeDrafts || !p.draft)
    .toSorted((a, b) => compareDatesNewestFirst(a.date, b.date));
}

/** One post with its raw markdown body. Throws if the slug is unknown. */
export function getPost(slug: string): Post {
  const meta = getPostIndex().find((p) => p.slug === slug);
  if (!meta) throw new ContentError(POSTS_INDEX, `  - no post with slug "${slug}"`);
  return { ...meta, body: readContentFile(`posts/${slug}.md`) };
}

/**
 * Loads and checks every content file. The root layout calls this, so any invalid
 * file fails `next build` even before a page uses that collection.
 */
export function validateAllContent(): void {
  getSite();
  getReviews();
  getTravel();
  getProjects();
  getExperience();
  getPostIndex();
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
      topic: `review.${r.type}`,
      message: `${offsetLabel(r.offset)} "${r.title}" · ${r.creator} · ${formatRating(r.rating)}/10`,
    })),
    ...real(getTravel()).map((p) => ({
      topic: "travel.visited",
      message: `${p.name}, ${p.country} · ${p.year}`,
    })),
    ...real(getPosts()).map((p) => ({
      topic: "post.published",
      message: `"${p.title}" · ${p.date}`,
    })),
    ...real(getProjects()).map((p) => ({
      topic: "project.added",
      message: p.tech.length ? `${p.name} · ${p.tech.join(", ")}` : p.name,
    })),
  ];
}

