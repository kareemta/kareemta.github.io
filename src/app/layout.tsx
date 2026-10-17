import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kareem",
  description: "TODO(user): one-line site description",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
