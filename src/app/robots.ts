import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";

// Static export: render once at build time to out/robots.txt.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
