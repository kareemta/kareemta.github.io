import type { Metadata } from "next";
import Container from "@/components/Container/Container";
import LogStream from "@/components/LogStream/LogStream";
import SiteFooter from "@/components/SiteFooter/SiteFooter";
import SiteHeader from "@/components/SiteHeader/SiteHeader";
import SkipLink from "@/components/SkipLink/SkipLink";
import { getSite, validateAllContent } from "@/lib/content";
import { streamInitScript } from "@/lib/stream";
import { themeInitScript } from "@/lib/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

validateAllContent();
const site = getSite();

export const metadata: Metadata = {
  title: site.displayName,
  description: site.tagline,
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
