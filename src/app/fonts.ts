import { Bricolage_Grotesque, JetBrains_Mono, Public_Sans } from "next/font/google";

// Fonts are downloaded at build time and self-hosted from out/, so nothing is
// fetched from Google at runtime. Each one is exposed as a CSS variable that the
// font tokens in globals.css build on.

export const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  // "optional": the name/titles are the LCP element; swapping in the display font
  // late on slow phones pushed LCP past 3.5s. It's preloaded, so it is used on
  // normal connections and on every later visit; on a slow first visit the
  // size-matched fallback stays instead of a late swap.
  display: "optional",
  variable: "--font-bricolage",
});

export const fontBody = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const fontVariables = [fontDisplay.variable, fontBody.variable, fontMono.variable].join(" ");
