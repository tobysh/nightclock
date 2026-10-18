import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tauri serves the static export from ./out
  output: "export",
  // set to "/repo-name" when hosting under a subpath (GitHub Pages project sites)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: { unoptimized: true },
  // hide the dev-mode Next.js badge
  devIndicators: false,
};

export default nextConfig;
