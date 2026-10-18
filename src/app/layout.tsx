import type { Metadata } from "next";
import Container from "@/components/Container/Container";
import LogStream from "@/components/LogStream/LogStream";
import SiteFooter from "@/components/SiteFooter/SiteFooter";
import SiteHeader from "@/components/SiteHeader/SiteHeader";
import SkipLink from "@/components/SkipLink/SkipLink";
import { getSite, validateAllContent } from "@/lib/content";
import { pageMetadata, SITE_URL } from "@/lib/metadata";
import { streamInitScript } from "@/lib/stream";
import { themeInitScript } from "@/lib/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

validateAllContent();
const site = getSite();

const defaultTitle = `${site.displayName} · ${site.headline}`;

export const metadata: Metadata = {
  // Makes relative URLs (og:image, canonical) absolute.
  metadataBase: new URL(SITE_URL),
  title: { default: defaultTitle, template: `%s · ${site.displayName}` },
  description: site.tagline,
  // Home page values; other pages override via pageMetadata().
  ...pageMetadata({ description: site.tagline, path: "/" }),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script may set data-theme / data-stream before React hydrates.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `${themeInitScript};${streamInitScript}` }} />
      </head>
      <body>
        <SkipLink targetId="main" />
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          <Container>{children}</Container>
        </main>
        <SiteFooter />
        <LogStream />
      </body>
    </html>
  );
}
