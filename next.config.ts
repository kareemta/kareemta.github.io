import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build a fully static site into out/ for GitHub Pages.
  output: "export",
  // GitHub Pages has no image optimization server.
  images: { unoptimized: true },
  // Emit about/index.html etc. so Pages serves /about/ without a server.
  trailingSlash: true,
  // Pin the project root so a stray lockfile in a parent folder is not picked up.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
