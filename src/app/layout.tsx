import type { Metadata } from "next";
import { getSite, validateAllContent } from "@/lib/content";
import "./globals.css";

validateAllContent();
const site = getSite();

export const metadata: Metadata = {
  title: site.displayName,
  description: site.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
