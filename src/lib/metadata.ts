/**
 * Shared page metadata. The root layout sets the title template, so pages pass a
 * plain title ("Books") and get "Books · Kareem Taleb-Agha". Open Graph and
 * Twitter tags are rebuilt per page, because a page's `openGraph` replaces the
 * layout's instead of merging with it.
 */
import type { Metadata } from "next";
import { getSite } from "@/lib/content";

export const SITE_URL = "https://kareemta.github.io";

/** Committed 1200x630 card in public/ (scripts/og-image.mjs regenerates it). */
export function ogImage() {
  const site = getSite();
  return { url: "/og.png", width: 1200, height: 630, alt: `${site.displayName}, ${site.headline}` };
}

type PageMeta = {
  /** Plain page title, without the site name. Omit for the home page. */
  title?: string;
  description: string;
  /** Site path with trailing slash, e.g. "/books/". */
  path: string;
};

export function pageMetadata({ title, description, path }: PageMeta): Metadata {
  const site = getSite();
  const fullTitle = title ? `${title} · ${site.displayName}` : `${site.displayName} · ${site.headline}`;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.displayName,
      title: fullTitle,
      description,
      url: path,
      images: [ogImage()],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage().url],
    },
  };
}
