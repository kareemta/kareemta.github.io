import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";
import { NAV_ITEMS } from "@/lib/nav";

// Static export: render once at build time to out/sitemap.xml.
export const dynamic = "force-static";

/** Real routes only (home + nav sections), with trailing slashes to match `trailingSlash: true`. */
const ROUTES = ["/", ...NAV_ITEMS.map((item) => item.href)];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({ url: `${SITE_URL}${route}` }));
}
